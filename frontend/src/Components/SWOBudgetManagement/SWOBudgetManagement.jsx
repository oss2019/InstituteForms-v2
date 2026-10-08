import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Container, Row, Col, Card, Button, Form, Modal, Table, Badge, Accordion, Spinner } from "react-bootstrap";
import "./SWOBudgetManagement.css";

const SWOBudgetManagement = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
    const role = localStorage.getItem("role");
    const userID = localStorage.getItem("userID");
    const userInfo = localStorage.getItem("user-info") ? JSON.parse(localStorage.getItem("user-info")) : {};
    const userName = userInfo.name || "SW Office";
    const availableCouncils = ["Technical Council", "Cultural Council", "Sports Council", "Hostel Council"];
    const getAcademicYears = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 6 }, (_, index) => {
            const startYear = currentYear - 2 + index;
            return `${startYear}-${startYear+1}`;
        });
    };
    const availableAcademicYears = getAcademicYears();

    const [availableClubs, setAvailableClubs] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [councils, setCouncils] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showYearModal, setShowYearModal] = useState(false);
    const [showCouncilModal, setShowCouncilModal] = useState(false);
    const [showClubModal, setShowClubModal] = useState(false);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [selectedCouncil, setSelectedCouncil] = useState(null);
    const [selectedClub, setSelectedClub] = useState(null);
    const [newAcademicYear, setNewAcademicYear] = useState("");
    const [newCouncilName, setNewCouncilName] = useState("");
    const [newCouncilBudget, setNewCouncilBudget] = useState("");
    const [newClubName, setNewClubName] = useState("");
    const [newClubBudget, setNewClubBudget] = useState("");
    const [transactionEventId, setTransactionEventId] = useState("");
    const [transactionAmount, setTransactionAmount] = useState("");
    const [transactionRemark, setTransactionRemark] = useState("");
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);

    const fetchAvailableClubs = async () => {
        try {
            const response = await axios.get(
                `${apiUrl}/budget/clubs`
            );

            setAvailableClubs(
                response.data || []
            );

        } catch (error) {
            console.error(
                "Error fetching clubs:",
                error
            );

            toast.error(
                "Failed to load clubs."
            );
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const response = await axios.get(`${apiUrl}/budget/academic-years`);
            const years = response.data || [];
            setAcademicYears(years);
            if (years.length > 0 && !selectedYear) {
                setSelectedYear(years[0]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load academic years.");
        }
    };

    const fetchBudgetOverview = async (year = selectedYear) => {
        if (!year) return;
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/budget/overview`, {
                params: {
                    academicYear: year,
                },
            });
            setCouncils(response.data.councils || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load budget data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailableClubs();
        fetchAcademicYears();
    }, []);

    useEffect(() => {
        if(selectedYear) {
        fetchBudgetOverview(); }
    }, [selectedYear]);

    const handleCreateAcademicYear = async () => {
        if (!newAcademicYear) {
            toast.error("Select an academic year.");
            return;
        }
        if(!newCouncilName.trim()){
            toast.error("Enter a council name.");
            return;
        }
        try {
            await axios.post(`${apiUrl}/budget/academic-year`, {
                academicYear: newAcademicYear.trim(),
                councilName: newCouncilName.trim(),
                approvedBudget: Number(newCouncilBudget || 0),
                role,
                userID,
            });
            toast.success("Academic Year Created.");
            setShowYearModal(false);
            setNewAcademicYear("");
            setNewCouncilName("");
            setNewCouncilBudget("");
            await fetchAcademicYears();
            setSelectedYear(newAcademicYear.trim());
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to create academic year.");
        }
    };

    const handleSaveCouncilBudget = async () => {
        if (!selectedCouncil) return;
        try {
            await axios.post(`${apiUrl}/budget/council`, {
                academicYear: selectedYear,
                councilName: selectedCouncil.councilName,
                approvedBudget: Number(selectedCouncil.councilBudget.approved),
                role,
                userID,
            });
            toast.success("Council budget updated.");
            await fetchBudgetOverview();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update council budget.");
        }
    };

    const handleSaveClub = async () => {
        if(!selectedCouncil || !newClubName.trim()) {
            toast.error("Enter club name.");
            return;
        }
        try {
            await axios.post(`${apiUrl}/budget/club`, {
                academicYear: selectedYear,
                councilName: selectedCouncil.councilName,
                clubName: newClubName.trim(),
                approvedBudget: Number(newClubBudget),
                role,
                userID,
            });
            toast.success("Club budget saved.");
            setShowClubModal(false);
            setNewClubName("");
            setNewClubBudget("");
            await fetchBudgetOverview();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to save club budget.");
        }
    };

    const handleDeleteClub = async (clubName) => {
        if(!window.confirm(`Delete ${clubName}?`)) {
            return;
        }
        try {
            await axios.delete(`${apiUrl}/budget/club`, {
                data: {
                    academicYear: selectedYear,
                    councilName: selectedCouncil.councilName,
                    clubName,
                    role,
                    userID,
                },
            });
            toast.success("Club deleted.");
            await fetchBudgetOverview();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to delete club.");
        }
    };

    const loadApprovedEvents = async () => {
        if (!selectedCouncil) return;
        setEventsLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/event/swo/approved-events`, {
                academicYear: selectedYear,
                limit: 10000,
            });
            const applications = response.data.applications || [];
            const filtered = applications.filter((event) => {
                if(event.councilName) {
                    return (
                        event.councilName === selectedCouncil.councilName
                    );
                }
                return true;
            });
            setApprovedEvents(filtered);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load approved events.");
        } finally {
            setEventsLoading(false);
        }
    };

    const handleAddTransaction = async () => {
      if (!selectedCouncil || !transactionEventId || !transactionAmount) {
        toast.error("Select an event and enter the amount.");
        return;
      }
      try {
        await axios.post(
          `${apiUrl}/budget/transaction`,
          {
            academicYear: selectedYear,
            councilName: selectedCouncil.councilName,
            clubName: selectedClub?.clubName || null,
            eventId: transactionEventId,
            amount: Number(transactionAmount),
            remark: transactionRemark,
            role,
            userID,
            userName,
          }
        );
        toast.success("Expenditure recorded successfully.");
        setShowTransactionModal(false);
        setTransactionEventId("");
        setTransactionAmount("");
        setTransactionRemark("");
        await fetchBudgetOverview();
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to record expenditure.");
      }
    };

    const openTransactionModal =
    async (
      council,
      club = null
    ) => {

      setSelectedCouncil(council);
      setSelectedClub(club);

      setTransactionEventId("");
      setTransactionAmount("");
      setTransactionRemark("");

      setShowTransactionModal(true);

      await loadApprovedEvents();
    };


  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const money = (value) => {

    return Number(value || 0)
      .toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      });
  };


  // ==========================================================
  // ACCESS CHECK
  // ==========================================================

  if (
    role !== "students-welfare-office"
  ) {

    return (
      <Container className="mt-4">
        <div className="alert alert-danger">
          You are not authorized to access
          Budget Management.
        </div>
      </Container>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <Container className="budget-container">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="budget-header">

        <div>

          <h2>
            Budget Management
          </h2>

          <p className="text-muted">
            Manage council and club yearly
            budgets and track event expenditure.
          </p>

        </div>


        <div className="d-flex gap-2">

          <Form.Select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(e.target.value)
            }
          >

            <option value="">
              Select Academic Year
            </option>

            {academicYears.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}

          </Form.Select>


          <Button
            variant="primary"
            onClick={() =>
              setShowYearModal(true)
            }
          >
            + Add Academic Year
          </Button>

        </div>

      </div>


      {/* ==================================================== */}
      {/* CONTENT */}
      {/* ==================================================== */}

      {loading ? (

        <div className="text-center py-5">

          <Spinner animation="border" />

        </div>

      ) : !selectedYear ? (

        <div className="alert alert-info">
          Select an academic year to view
          budget information.
        </div>

      ) : councils.length === 0 ? (

        <div className="text-center py-5">

          <h5>
            No councils found
          </h5>

          <p className="text-muted">
            Add a council to start managing
            the budget for {selectedYear}.
          </p>

          <Button
            onClick={() =>
              setShowYearModal(true)
            }
          >
            Add Council
          </Button>

        </div>

      ) : (

        <Accordion
          defaultActiveKey="0"
          className="budget-accordion"
        >

          {councils.map(
            (council, councilIndex) => (

              <Accordion.Item
                eventKey={
                  councilIndex.toString()
                }
                key={council._id}
              >

                <Accordion.Header>

                  <div className="council-header">

                    <strong>
                      {council.councilName}
                    </strong>

                    <span>
                      Remaining:{" "}
                      <strong>
                        {money(
                          council.remainingBudget
                        )}
                      </strong>
                    </span>

                  </div>

                </Accordion.Header>


                <Accordion.Body>

                  {/* ======================================== */}
                  {/* COUNCIL SUMMARY */}
                  {/* ======================================== */}

                  <Row className="g-3 mb-4">

                    <Col md={4}>

                      <Card className="budget-stat">

                        <Card.Body>

                          <div>
                            Approved Budget
                          </div>

                          <h4>
                            {money(
                              council
                                .councilBudget
                                .approved
                            )}
                          </h4>

                        </Card.Body>

                      </Card>

                    </Col>


                    <Col md={4}>

                      <Card className="budget-stat">

                        <Card.Body>

                          <div>
                            Total Spent
                          </div>

                          <h4>
                            {money(
                              council.spentBudget
                            )}
                          </h4>

                        </Card.Body>

                      </Card>

                    </Col>


                    <Col md={4}>

                      <Card className="budget-stat">

                        <Card.Body>

                          <div>
                            Remaining
                          </div>

                          <h4>
                            {money(
                              council.remainingBudget
                            )}
                          </h4>

                        </Card.Body>

                      </Card>

                    </Col>

                  </Row>


                  {/* ======================================== */}
                  {/* COUNCIL ACTIONS */}
                  {/* ======================================== */}

                  <div className="d-flex gap-2 mb-4">

                    <Button
                      variant="outline-primary"
                      onClick={() => {

                        setSelectedCouncil(
                          JSON.parse(
                            JSON.stringify(
                              council
                            )
                          )
                        );

                        setShowCouncilModal(
                          true
                        );

                      }}
                    >
                      Edit Council Budget
                    </Button>


                    <Button
                      variant="success"
                      onClick={() =>
                        openTransactionModal(
                          council,
                          null
                        )
                      }
                    >
                      Record Council Expenditure
                    </Button>

                  </div>


                  {/* ======================================== */}
                  {/* CLUBS */}
                  {/* ======================================== */}

                  <div className="d-flex justify-content-between align-items-center mb-3">

                    <h5 className="mb-0">
                      Clubs
                    </h5>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {

                        setSelectedCouncil(
                          council
                        );

                        setNewClubName("");
                        setNewClubBudget("");

                        setShowClubModal(
                          true
                        );

                      }}
                    >
                      + Add Club
                    </Button>

                  </div>


                  {council.clubs.length === 0 ? (

                    <div className="alert alert-light">
                      No clubs have been added
                      to this council yet.
                    </div>

                  ) : (

                    <Row className="g-3">

                      {council.clubs.map(
                        (club) => (

                          <Col
                            md={6}
                            lg={4}
                            key={club._id}
                          >

                            <Card className="club-card h-100">

                              <Card.Body>

                                <div className="d-flex justify-content-between">

                                  <h6>
                                    {club.clubName}
                                  </h6>

                                  <Badge
                                    bg={
                                      club.remainingBudget < 0
                                        ? "danger"
                                        : "success"
                                    }
                                  >
                                    {money(
                                      club.remainingBudget
                                    )}
                                    {" "}left
                                  </Badge>

                                </div>


                                <div className="club-budget-row">
                                  <span>
                                    Approved
                                  </span>

                                  <strong>
                                    {money(
                                      club.approvedBudget
                                    )}
                                  </strong>
                                </div>


                                <div className="club-budget-row">
                                  <span>
                                    Spent
                                  </span>

                                  <strong>
                                    {money(
                                      club.spentBudget
                                    )}
                                  </strong>
                                </div>


                                <div className="club-budget-row">
                                  <span>
                                    Remaining
                                  </span>

                                  <strong>
                                    {money(
                                      club.remainingBudget
                                    )}
                                  </strong>
                                </div>


                                <hr />


                                <div className="d-flex flex-wrap gap-2">

                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() =>
                                      openTransactionModal(
                                        council,
                                        club
                                      )
                                    }
                                  >
                                    Record Spending
                                  </Button>


                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => {

                                      setSelectedCouncil(
                                        council
                                      );

                                      setNewClubName(
                                        club.clubName
                                      );

                                      setNewClubBudget(
                                        club.approvedBudget
                                      );

                                      setShowClubModal(
                                        true
                                      );

                                    }}
                                  >
                                    Edit
                                  </Button>


                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() =>
                                      handleDeleteClub(
                                        club.clubName
                                      )
                                    }
                                  >
                                    Delete
                                  </Button>

                                </div>


                                {/* ================================= */}
                                {/* TRANSACTIONS */}
                                {/* ================================= */}

                                {club.transactions &&
                                  club.transactions.length >
                                    0 && (

                                  <div className="mt-3">

                                    <h6>
                                      Transactions
                                    </h6>

                                    <div className="table-responsive">

                                      <Table
                                        size="sm"
                                        bordered
                                        hover
                                      >

                                        <thead>

                                          <tr>

                                            <th>
                                              Event
                                            </th>

                                            <th>
                                              Reference
                                            </th>

                                            <th>
                                              Amount
                                            </th>

                                          </tr>

                                        </thead>


                                        <tbody>

                                          {club.transactions.map(
                                            (transaction) => (

                                              <tr
                                                key={
                                                  transaction._id
                                                }
                                              >

                                                <td>
                                                  {transaction.eventName}
                                                </td>

                                                <td>
                                                  <code>
                                                    {
                                                      transaction.referenceNumber
                                                    }
                                                  </code>
                                                </td>

                                                <td>
                                                  {money(
                                                    transaction.amount
                                                  )}
                                                </td>

                                              </tr>

                                            )
                                          )}

                                        </tbody>

                                      </Table>

                                    </div>

                                  </div>

                                )}

                              </Card.Body>

                            </Card>

                          </Col>

                        )
                      )}

                    </Row>

                  )}

                </Accordion.Body>

              </Accordion.Item>

            )
          )}

        </Accordion>

      )}


      {/* ==================================================== */}
      {/* ADD ACADEMIC YEAR */}
      {/* ==================================================== */}

      <Modal
        show={showYearModal}
        onHide={() =>
          setShowYearModal(false)
        }
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Add Academic Year
          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Form.Group className="mb-3">

            <Form.Label>
              Academic Year
            </Form.Label>

            <Form.Select
                value={newAcademicYear}
                onChange={(e) =>
                    setNewAcademicYear(e.target.value)
                }
            >
                <option value="">
                    Select Academic Year
                </option>

                {availableAcademicYears.map((year) => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </Form.Select>
        </Form.Group>


          <Form.Group className="mb-3">

            <Form.Label>
              First Council
            </Form.Label>

            <Form.Select
                value={newCouncilName}
                onChange={(e) =>
                    setNewCouncilName(e.target.value)
                }
            >
                <option value="">
                    Select Council
                </option>

                {availableCouncils.map((council) => (
                    <option key={council} value={council}>
                        {council}
                    </option>
                ))}
            </Form.Select>

          </Form.Group>


          <Form.Group>

            <Form.Label>
              Council Approved Budget
            </Form.Label>

            <Form.Control
              type="number"
              min="0"
              value={newCouncilBudget}
              onChange={(e) =>
                setNewCouncilBudget(
                  e.target.value
                )
              }
            />

          </Form.Group>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setShowYearModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={
              handleCreateAcademicYear
            }
          >
            Create
          </Button>

        </Modal.Footer>

      </Modal>


      {/* ==================================================== */}
      {/* EDIT COUNCIL BUDGET */}
      {/* ==================================================== */}

      <Modal
        show={showCouncilModal}
        onHide={() =>
          setShowCouncilModal(false)
        }
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Edit Council Budget
          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          {selectedCouncil && (

            <>

              <p>
                <strong>
                  {selectedCouncil.councilName}
                </strong>
              </p>

              <Form.Group>

                <Form.Label>
                  Approved Yearly Budget
                </Form.Label>

                <Form.Control
                  type="number"
                  min="0"
                  value={
                    selectedCouncil
                      .councilBudget
                      .approved
                  }
                  onChange={(e) =>
                    setSelectedCouncil({
                      ...selectedCouncil,

                      councilBudget: {
                        ...selectedCouncil.councilBudget,

                        approved:
                          Number(
                            e.target.value
                          ),
                      },
                    })
                  }
                />

              </Form.Group>

            </>

          )}

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setShowCouncilModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={async () => {

              await handleSaveCouncilBudget();

              setShowCouncilModal(
                false
              );

            }}
          >
            Save
          </Button>

        </Modal.Footer>

      </Modal>


      {/* ==================================================== */}
      {/* ADD / EDIT CLUB */}
      {/* ==================================================== */}

      <Modal
        show={showClubModal}
        onHide={() =>
          setShowClubModal(false)
        }
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            {councils.some(
              (c) =>
                c.clubs?.some(
                  (club) =>
                    club.clubName ===
                    newClubName
                )
            )
              ? "Edit Club"
              : "Add Club"}
          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          <Form.Group className="mb-3">

            <Form.Label>
              Club Name
            </Form.Label>

            <Form.Select
                value={newClubName}
                onChange={(e) =>
                    setNewClubName(e.target.value)
                }
            >
                <option value="">
                    Select Club
                </option>

                {availableClubs
                    .filter((club) => {

                        if (!selectedCouncil) {
                            return true;
                        }

                        const isCurrentClub =
                            club.name === newClubName;

                        const alreadyAdded =
                            selectedCouncil.clubs?.some(
                                (existingClub) =>
                                    existingClub.clubName ===
                                    club.name
                            );

                        return (
                            isCurrentClub ||
                            !alreadyAdded
                        );
                    })
                    .map((club) => (
                        <option
                            key={club._id}
                            value={club.name}
                        >
                            {club.name}
                        </option>
                    ))}
            </Form.Select>

          </Form.Group>


          <Form.Group>

            <Form.Label>
              Approved Yearly Budget
            </Form.Label>

            <Form.Control
              type="number"
              min="0"
              value={newClubBudget}
              onChange={(e) =>
                setNewClubBudget(
                  e.target.value
                )
              }
            />

          </Form.Group>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setShowClubModal(false)
            }
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={
              handleSaveClub
            }
          >
            Save
          </Button>

        </Modal.Footer>

      </Modal>


      {/* ==================================================== */}
      {/* RECORD TRANSACTION */}
      {/* ==================================================== */}

      <Modal
        show={showTransactionModal}
        onHide={() =>
          setShowTransactionModal(false)
        }
        size="lg"
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title>
            Record Expenditure
          </Modal.Title>

        </Modal.Header>


        <Modal.Body>

          {selectedCouncil && (

            <div className="alert alert-info">

              <strong>
                {selectedCouncil.councilName}
              </strong>

              {selectedClub && (
                <>
                  {" → "}
                  <strong>
                    {selectedClub.clubName}
                  </strong>
                </>
              )}

            </div>

          )}


          <Form.Group className="mb-3">

            <Form.Label>
              Event
            </Form.Label>

            {eventsLoading ? (

              <div>
                <Spinner
                  size="sm"
                  animation="border"
                />
                {" "}Loading events...
              </div>

            ) : (

              <Form.Select
                value={
                  transactionEventId
                }
                onChange={(e) =>
                  setTransactionEventId(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select Event
                </option>

                {approvedEvents.map(
                  (event) => (

                    <option
                      key={event._id}
                      value={event._id}
                    >
                      {event.eventName}
                      {" — "}
                      {event.referenceNumber ||
                        "No Reference"}
                    </option>

                  )
                )}

              </Form.Select>

            )}

          </Form.Group>


          <Form.Group className="mb-3">

            <Form.Label>
              Actual Amount Spent
            </Form.Label>

            <Form.Control
              type="number"
              min="0"
              value={
                transactionAmount
              }
              onChange={(e) =>
                setTransactionAmount(
                  e.target.value
                )
              }
            />

          </Form.Group>


          <Form.Group>

            <Form.Label>
              Remark
            </Form.Label>

            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Optional remark"
              value={
                transactionRemark
              }
              onChange={(e) =>
                setTransactionRemark(
                  e.target.value
                )
              }
            />

          </Form.Group>

        </Modal.Body>


        <Modal.Footer>

          <Button
            variant="secondary"
            onClick={() =>
              setShowTransactionModal(
                false
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="success"
            onClick={
              handleAddTransaction
            }
          >
            Record Expenditure
          </Button>

        </Modal.Footer>

      </Modal>

    </Container>
  );
};

export default SWOBudgetManagement;