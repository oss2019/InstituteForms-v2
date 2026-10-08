import Budget from "../models/Budget.js";
import User from "../models/user.model.js";
import EventApproval from "../models/event.model.js";

const SWO_ROLE = "students-welfare-office";

const isSWO = (role) => {
  return role === SWO_ROLE;
};

const validateAcademicYear = (academicYear) => {
  return /^\d{4}-\d{4}$/.test(academicYear);
};


// ============================================================
// GET ACADEMIC YEARS
// ============================================================

export const getClubsFromUsers = async (req, res) => {
  try {
    const users = await User.find(
      {
        role: "club-secretary",
      },
      {
        name: 1,
        type: 1,
        _id: 1,
      }
    ).sort({
      name: 1,
    });

    res.status(200).json(
      users.map((user) => ({
        _id: user._id,
        name: user.name,
        type: user.type,
      }))
    );

  } catch (error) {
    console.error(
      "Error fetching clubs from users:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch clubs.",
    });
  }
};

export const getAcademicYears = async (req, res) => {
  try {
    const years = await Budget.distinct("academicYear");

    years.sort((a, b) => {
      return (
        parseInt(b.split("-")[0]) -
        parseInt(a.split("-")[0])
      );
    });

    res.status(200).json(years);
  } catch (error) {
    console.error(
      "Error fetching academic years:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch academic years",
    });
  }
};


// ============================================================
// CREATE ACADEMIC YEAR + FIRST COUNCIL
// ============================================================

export const createAcademicYear = async (
  req,
  res
) => {
  try {
    const {
      academicYear,
      councilName,
      approvedBudget,
      role,
      userID,
    } = req.body;

    if (!isSWO(role)) {
      return res.status(403).json({
        message:
          "Only SWO can create academic years.",
      });
    }

    if (
      !academicYear ||
      !validateAcademicYear(academicYear)
    ) {
      return res.status(400).json({
        message:
          "Academic year must be in YYYY-YYYY format.",
      });
    }

    if (
      !councilName ||
      !councilName.trim()
    ) {
      return res.status(400).json({
        message:
          "Council name is required.",
      });
    }

    const existing =
      await Budget.findOne({
        academicYear,
        councilName:
          councilName.trim(),
      });

    if (existing) {
      return res.status(409).json({
        message:
          "This council already exists for the selected academic year.",
      });
    }

    const budget =
      await Budget.create({
        academicYear,

        councilName:
          councilName.trim(),

        councilBudget: {
          approved:
            Number(
              approvedBudget || 0
            ),
        },

        clubs: [],

        transactions: [],

        createdBy:
          userID || SWO_ROLE,

        updatedBy:
          userID || SWO_ROLE,
      });

    res.status(201).json({
      message:
        "Academic year and council created successfully.",

      budget,
    });
  } catch (error) {
    console.error(
      "Error creating academic year:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create academic year.",
    });
  }
};


// ============================================================
// GET COMPLETE BUDGET OVERVIEW
// ============================================================

export const getBudgetOverview = async (
  req,
  res
) => {
  try {
    const {
      academicYear,
    } = req.query;

    if (!academicYear) {
      return res.status(400).json({
        message:
          "Academic year is required.",
      });
    }

    const budgets =
      await Budget.find({
        academicYear,
      })
        .sort({
          councilName: 1,
        })
        .lean();

    const result =
      budgets.map((budget) => {

        // ----------------------------------------------------
        // Council-level transactions
        // ----------------------------------------------------

        const councilTransactions =
          budget.transactions.filter(
            (transaction) =>
              !transaction.clubName
          );

        const councilSpent =
          councilTransactions.reduce(
            (total, transaction) =>
              total +
              Number(
                transaction.amount || 0
              ),
            0
          );


        // ----------------------------------------------------
        // Clubs
        // ----------------------------------------------------

        const clubs =
          budget.clubs.map(
            (club) => {

              const clubTransactions =
                budget.transactions.filter(
                  (transaction) =>
                    transaction.clubName ===
                    club.clubName
                );

              const spent =
                clubTransactions.reduce(
                  (total, transaction) =>
                    total +
                    Number(
                      transaction.amount ||
                        0
                    ),
                  0
                );

              return {
                ...club,

                spentBudget:
                  spent,

                remainingBudget:
                  Number(
                    club.approvedBudget ||
                      0
                  ) - spent,

                transactions:
                  clubTransactions,
              };
            }
          );


        // ----------------------------------------------------
        // Total council expenditure
        // ----------------------------------------------------

        const totalCouncilSpent =
          budget.transactions.reduce(
            (total, transaction) =>
              total +
              Number(
                transaction.amount || 0
              ),
            0
          );


        return {
          ...budget,

          spentBudget:
            totalCouncilSpent,

          remainingBudget:
            Number(
              budget.councilBudget
                ?.approved || 0
            ) -
            totalCouncilSpent,

          councilTransactions,

          clubs,
        };
      });


    res.status(200).json({
      academicYear,

      councils:
        result,
    });

  } catch (error) {
    console.error(
      "Error fetching budget overview:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch budget overview.",
    });
  }
};


// ============================================================
// ADD / UPDATE COUNCIL BUDGET
// ============================================================

export const saveCouncilBudget = async (
  req,
  res
) => {
  try {
    const {
      academicYear,
      councilName,
      approvedBudget,
      role,
      userID,
    } = req.body;

    if (!isSWO(role)) {
      return res.status(403).json({
        message:
          "Only SWO can manage budgets.",
      });
    }

    if (
      !academicYear ||
      !councilName
    ) {
      return res.status(400).json({
        message:
          "Academic year and council name are required.",
      });
    }

    const amount =
      Number(approvedBudget);

    if (
      isNaN(amount) ||
      amount < 0
    ) {
      return res.status(400).json({
        message:
          "Invalid budget amount.",
      });
    }

    const budget =
      await Budget.findOneAndUpdate(
        {
          academicYear,

          councilName:
            councilName.trim(),
        },

        {
          $set: {
            councilBudget: {
              approved:
                amount,
            },

            updatedBy:
              userID ||
              SWO_ROLE,
          },

          $setOnInsert: {
            academicYear,

            councilName:
              councilName.trim(),

            createdBy:
              userID ||
              SWO_ROLE,

            clubs: [],

            transactions: [],
          },
        },

        {
          new: true,

          upsert: true,

          setDefaultsOnInsert:
            true,
        }
      );


    res.status(200).json({
      message:
        "Council budget saved successfully.",

      budget,
    });

  } catch (error) {
    console.error(
      "Error saving council budget:",
      error
    );

    res.status(500).json({
      message:
        "Failed to save council budget.",
    });
  }
};


// ============================================================
// ADD / UPDATE CLUB BUDGET
// ============================================================

export const saveClubBudget = async (
  req,
  res
) => {
  try {
    const {
      academicYear,
      councilName,
      clubName,
      approvedBudget,
      role,
      userID,
    } = req.body;

    if (!isSWO(role)) {
      return res.status(403).json({
        message:
          "Only SWO can manage budgets.",
      });
    }

    if (
      !academicYear ||
      !councilName ||
      !clubName
    ) {
      return res.status(400).json({
        message:
          "Academic year, council and club are required.",
      });
    }

    const amount =
      Number(approvedBudget);

    if (
      isNaN(amount) ||
      amount < 0
    ) {
      return res.status(400).json({
        message:
          "Invalid budget amount.",
      });
    }


    const budget =
      await Budget.findOne({
        academicYear,

        councilName:
          councilName.trim(),
      });


    if (!budget) {
      return res.status(404).json({
        message:
          "Council budget does not exist for this academic year.",
      });
    }


    const clubIndex =
      budget.clubs.findIndex(
        (club) =>
          club.clubName ===
          clubName.trim()
      );


    if (clubIndex === -1) {

      budget.clubs.push({
        clubName:
          clubName.trim(),

        approvedBudget:
          amount,
      });

    } else {

      budget.clubs[
        clubIndex
      ].approvedBudget =
        amount;
    }


    budget.updatedBy =
      userID ||
      SWO_ROLE;

    await budget.save();


    res.status(200).json({
      message:
        "Club budget saved successfully.",

      budget,
    });

  } catch (error) {
    console.error(
      "Error saving club budget:",
      error
    );

    res.status(500).json({
      message:
        "Failed to save club budget.",
    });
  }
};


// ============================================================
// DELETE CLUB
// ============================================================

export const deleteClub = async (
  req,
  res
) => {
  try {
    const {
      academicYear,
      councilName,
      clubName,
      role,
      userID,
    } = req.body;

    if (!isSWO(role)) {
      return res.status(403).json({
        message:
          "Only SWO can manage budgets.",
      });
    }


    const budget =
      await Budget.findOne({
        academicYear,
        councilName,
      });


    if (!budget) {
      return res.status(404).json({
        message:
          "Budget not found.",
      });
    }


    const hasTransactions =
      budget.transactions.some(
        (transaction) =>
          transaction.clubName ===
          clubName
      );


    if (hasTransactions) {
      return res.status(400).json({
        message:
          "This club cannot be deleted because it has recorded expenditures.",
      });
    }


    budget.clubs =
      budget.clubs.filter(
        (club) =>
          club.clubName !==
          clubName
      );


    budget.updatedBy =
      userID ||
      SWO_ROLE;


    await budget.save();


    res.status(200).json({
      message:
        "Club removed successfully.",
    });

  } catch (error) {
    console.error(
      "Error deleting club:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete club.",
    });
  }
};


// ============================================================
// RECORD EVENT EXPENDITURE
// ============================================================

export const addBudgetTransaction =
  async (req, res) => {

    try {

      const {
        academicYear,
        councilName,
        clubName,
        eventId,
        amount,
        remark,
        role,
        userID,
        userName,
      } = req.body;


      if (!isSWO(role)) {
        return res.status(403).json({
          message:
            "Only SWO can record expenditure.",
        });
      }


      if (
        !academicYear ||
        !councilName ||
        !eventId ||
        amount === undefined
      ) {
        return res.status(400).json({
          message:
            "Academic year, council, event and amount are required.",
        });
      }


      const spentAmount =
        Number(amount);


      if (
        isNaN(spentAmount) ||
        spentAmount <= 0
      ) {
        return res.status(400).json({
          message:
            "Amount must be greater than zero.",
        });
      }


      // ------------------------------------------------------
      // Find event
      // ------------------------------------------------------

      const event =
        await EventApproval
          .findById(eventId)
          .lean();


      if (!event) {
        return res.status(404).json({
          message:
            "Event not found.",
        });
      }


      // ------------------------------------------------------
      // Academic year check
      // ------------------------------------------------------

      if (
        event.academicYear !==
        academicYear
      ) {
        return res.status(400).json({
          message:
            "Event does not belong to the selected academic year.",
        });
      }


      // ------------------------------------------------------
      // Find council budget
      // ------------------------------------------------------

      const budget =
        await Budget.findOne({
          academicYear,

          councilName:
            councilName.trim(),
        });


      if (!budget) {
        return res.status(404).json({
          message:
            "Council budget not found.",
        });
      }


      // ------------------------------------------------------
      // Determine club
      // ------------------------------------------------------

      const actualClubName =
        clubName ||
        event.clubName ||
        null;


      // ------------------------------------------------------
      // Determine approved budget
      // ------------------------------------------------------

      let approvedBudget;


      if (actualClubName) {

        const club =
          budget.clubs.find(
            (c) =>
              c.clubName ===
              actualClubName
          );


        if (!club) {
          return res.status(404).json({
            message:
              "No budget has been assigned to this club.",
          });
        }


        approvedBudget =
          Number(
            club.approvedBudget
          );

      } else {

        approvedBudget =
          Number(
            budget.councilBudget
              ?.approved || 0
          );
      }


      // ------------------------------------------------------
      // Current spending
      // ------------------------------------------------------

      const currentSpent =
        budget.transactions
          .filter(
            (transaction) =>
              (
                transaction.clubName ||
                null
              ) === actualClubName
          )
          .reduce(
            (total, transaction) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          );


      // ------------------------------------------------------
      // Check budget
      // ------------------------------------------------------

      if (
        currentSpent +
          spentAmount >
        approvedBudget
      ) {

        return res.status(400).json({

          message:
            actualClubName
              ? "Expenditure exceeds the club's approved yearly budget."
              : "Expenditure exceeds the council's approved yearly budget.",

          approvedBudget,

          alreadySpent:
            currentSpent,

          remaining:
            approvedBudget -
            currentSpent,
        });
      }


      // ------------------------------------------------------
      // Duplicate check
      // ------------------------------------------------------

      const duplicate =
        budget.transactions.find(
          (transaction) =>
            transaction.eventId
              .toString() ===
              eventId &&
            (
              transaction.clubName ||
              null
            ) === actualClubName
        );


      if (duplicate) {
        return res.status(409).json({
          message:
            "Expenditure for this event has already been recorded for this budget.",
        });
      }


      // ------------------------------------------------------
      // Add transaction
      // ------------------------------------------------------

      budget.transactions.push({

        eventId:
          event._id,

        eventName:
          event.eventName,

        referenceNumber:
          event.referenceNumber ||
          "Not Applicable",

        clubName:
          actualClubName,

        amount:
          spentAmount,

        spentAt:
          new Date(),

        remark:
          remark || "",

        enteredBy:
          userID ||
          SWO_ROLE,

        enteredByName:
          userName ||
          "SW Office",
      });


      budget.updatedBy =
        userID ||
        SWO_ROLE;


      await budget.save();


      const newTransaction =
        budget.transactions[
          budget.transactions.length -
            1
        ];


      res.status(201).json({

        message:
          "Expenditure recorded successfully.",

        transaction:
          newTransaction,

        remainingBudget:
          approvedBudget -
          currentSpent -
          spentAmount,
      });

    } catch (error) {

      console.error(
        "Error recording expenditure:",
        error
      );

      res.status(500).json({
        message:
          "Failed to record expenditure.",
      });
    }
  };


// ============================================================
// DELETE TRANSACTION
// ============================================================

export const deleteBudgetTransaction =
  async (req, res) => {

    try {

      const {
        academicYear,
        councilName,
        transactionId,
        role,
        userID,
      } = req.body;


      if (!isSWO(role)) {
        return res.status(403).json({
          message:
            "Only SWO can modify transactions.",
        });
      }


      const budget =
        await Budget.findOne({
          academicYear,
          councilName,
        });


      if (!budget) {
        return res.status(404).json({
          message:
            "Budget not found.",
        });
      }


      const transaction =
        budget.transactions.id(
          transactionId
        );


      if (!transaction) {
        return res.status(404).json({
          message:
            "Transaction not found.",
        });
      }


      budget.transactions.pull(
        transactionId
      );


      budget.updatedBy =
        userID ||
        SWO_ROLE;


      await budget.save();


      res.status(200).json({
        message:
          "Transaction deleted successfully.",
      });

    } catch (error) {

      console.error(
        "Error deleting transaction:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete transaction.",
      });
    }
  };


// ============================================================
// GET TRANSACTIONS
// ============================================================

export const getBudgetTransactions =
  async (req, res) => {

    try {

      const {
        academicYear,
        councilName,
        clubName,
      } = req.query;


      const budget =
        await Budget.findOne({
          academicYear,
          councilName,
        }).lean();


      if (!budget) {
        return res.status(404).json({
          message:
            "Budget not found.",
        });
      }


      let transactions =
        budget.transactions || [];


      if (clubName) {

        transactions =
          transactions.filter(
            (transaction) =>
              transaction.clubName ===
              clubName
          );
      }


      transactions.sort(
        (a, b) =>
          new Date(b.spentAt) -
          new Date(a.spentAt)
      );


      res.status(200).json(
        transactions
      );

    } catch (error) {

      console.error(
        "Error fetching transactions:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch transactions.",
      });
    }
  };