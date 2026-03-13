import { Routes, Route, Link } from "react-router-dom";
import StudentNavbar from "../../Components/StudentNavbar/StudentNavbar";
import MessFeedbackForm from "../../Components/MessFeedback/MessFeedbackForm";
import CanteenFeedbackForm from "../../Components/CanteenFeedback/CanteenFeedbackForm";
import AccommodationForm from "../../Components/AccommodationForm/AccommodationForm";
import AccommodationBookingForm from "../../Components/AccommodationBooking/AccommodationBookingForm";
import MyComplaints from "../../Components/WelfareComplaints/MyComplaints";
import Footer from "../../Components/Footer/Footer";
import "./StudentPortal.css";

/* Dashboard "home" tab */
const StudentHome = () => {
  const user = JSON.parse(localStorage.getItem("user-info") || "{}");
  const firstName = (user.name || user.email?.split("@")[0] || "Student").split(" ")[0];

  const quickActions = [
    {
      to:    "/student/mess",
      icon:  "🍽️",
      cls:   "sp-quick-card__icon--mess",
      title: "Mess Complaint",
      desc:  "Submit a formal complaint about food quality, hygiene, service or quantity. Tracked with a unique ID.",
    },
    {
      to:    "/student/canteen",
      icon:  "☕",
      cls:   "sp-quick-card__icon--canteen",
      title: "Canteen Complaint",
      desc:  "Report issues with canteen outlets — pricing, hygiene, staff behaviour, or product quality.",
    },
    {
      to:    "/student/hostel",
      icon:  "🏠",
      cls:   "sp-quick-card__icon--accom",
      title: "Hostel Complaint",
      desc:  "Report hostel maintenance and infrastructure issues with full workflow tracking.",
    },
    {
      to:    "/student/my-complaints",
      icon:  "📋",
      cls:   "sp-quick-card__icon--canteen",
      title: "My Complaints",
      desc:  "Track complaints you submitted and reply to queries from the reviewing authorities.",
    },
    {
      to:    "/student/accommodation-booking",
      icon:  "🛏️",
      cls:   "sp-quick-card__icon--accom",
      title: "Accommodation Booking",
      desc:  "Book mess block guest rooms for parents/relatives and track approval workflow status.",
    },
  ];

  return (
    <div className="sp-welcome">
      <h1>Welcome back, {firstName} 👋</h1>
      <p>
        Use this portal to submit feedback and requests to the relevant
        secretaries. Your submissions are tracked and reviewed promptly.
      </p>
      <div className="sp-quick-grid">
        {quickActions.map((card) => (
          <Link key={card.to} to={card.to} className="sp-quick-card">
            <div className={`sp-quick-card__icon ${card.cls}`}>{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            <span className="sp-quick-card__arrow">Go →</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* Main portal wrapper */
const StudentPortal = () => {
  return (
    <div className="sp-layout">
      <StudentNavbar />
      <div className="sp-content">
        <Routes>
          <Route index element={<StudentHome />} />
          <Route path="mess"              element={<MessFeedbackForm />} />
          <Route path="canteen"           element={<CanteenFeedbackForm />} />
          <Route path="hostel"            element={<AccommodationForm />} />
          <Route path="accommodation-booking" element={<AccommodationBookingForm />} />
          <Route path="my-complaints"     element={<MyComplaints />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

export default StudentPortal;
