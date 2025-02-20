import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./Footer.css"

const Footer = () => {
    return (
        <footer className="footer full-width-footer pt-5 pb-4">
                <div className="row text-md-left footer-main">
                    <div className="col-md-3 col-lg-3 col-xl-4 mx-auto mt-3">
                        <img src="/IIT dh logo.png" className="footer-logo"/>
                        <p className="font-weight-bold">INDIAN INSTITUTE OF TECHNOLOGY DHARWAD<br/>PERMANENT CAMPUS<br/>CHIKKAMALLIGAWAD<br/>DHARWAD - 580007<br/>KARNATAKA,<br/>BHARATA (INDIA)</p>
                    </div>
					<div className="col-md-2 col-lg-2 col-xl-2 mx-auto mt-3">
						<h5 className="footer-title mb-4 font-weight-bold">ACADEMICS</h5>
						<hr className="mb-4"/>
						<p><a href="https://www.iitdh.ac.in/btechbs-ms-ug" className="foot-link"> Admissions</a></p>
						<p><a href="https://www.iitdh.ac.in/academic-calendar" className="foot-link"> Announcements</a></p>
						<p><a href="https://www.iitdh.ac.in/departments" className="foot-link"> Departments</a></p>
						<p><a href="https://www.iitdh.ac.in/programs" className="foot-link"> Programs</a></p>
					</div>
					<div className="col-md-3 col-lg-2 col-xl-2 mx-auto mt-3">
						<h5 className="footer-title mb-4 font-weight-bold">RESEARCH</h5>
						<hr className="mb-4"/>
						<p><a href="https://www.iitdh.ac.in/consultancy-projects" className="foot-link">Consultancy Projects</a></p>
						<p><a href="https://iitdh.irins.org/" className="foot-link">IRINS</a></p>
						<p><a href="https://www.iitdh.ac.in/other-recruitments" className="foot-link">Project Vacancies</a></p>
                        <p><a href="https://www.iitdh.ac.in/publications" className="foot-link">Publications</a></p>
						<p><a href="https://www.iitdh.ac.in/sponsored-projects" className="foot-link">Sponsored Projects</a></p>
					</div>
					<div className="col-md-3 col-lg-2 col-xl-2 mx-auto mt-3">
						<h5 className="footer-title mb-4 font-weight-bold">PEOPLE</h5>
						<hr className="mb-4"/>
						<p><a href="https://www.iitdh.ac.in/board-governors" className="foot-link">Administration</a></p>
						<p><a href="https://www.iitdh.ac.in/faculty" className="foot-link">Faculty</a></p>
						<p><a href="https://www.iitdh.ac.in/staff" className="foot-link">Staff</a></p>
                        <p><a href="https://studentswelfare.iitdh.ac.in/" className="foot-link"> Students</a></p>
					</div>
					<div className="col-md-3 col-lg-2 col-xl-2 mx-auto mt-3">
						<h5 className="footer-title mb-4 font-weight-bold">QUICK ACCESS</h5>
						<hr className="mb-4"/>
						<p><a href="https://www.iitdh.ac.in/about-dharwad" className="foot-link">About dhArwAD</a></p>
						<p><a href="https://www.iitdh.ac.in/institute-anti-ragging-cell" className="foot-link">Anti-Ragging Cell</a></p>
						<p><a href="https://www.iitdh.ac.in/schedule-buses" className="foot-link">Bus Schedule</a></p>
                        <p><a href="https://www.iitdh.ac.in/chief-vigilance-officer" className="foot-link">Chief Vigilance Officer</a></p>
						<p><a href="https://www.iitdh.ac.in/contact-us" className="foot-link">Contact Us</a></p>
						<p><a href="https://www.iitdh.ac.in/counselling-center" className="foot-link">Counselling Center</a></p>
						<p><a href="https://csr-iitdh.onrender.com/" className="foot-link">CSR</a></p>
						<p><a href="https://www.iitdh.ac.in/events" className="foot-link">Events</a></p>
						<p><a href="https://www.iitdh.ac.in/grievance-redressal-committee" className="foot-link">Grievance Redressal</a></p>
						<p><a href="https://www.iitdh.ac.in/internal-complaints-committeeicc" className="foot-link">ICC</a></p>
						<p><a href="https://intranet.iitdh.ac.in:444/" className="foot-link">Intranet</a></p>
						<p><a href="https://old.iitdh.ac.in/" className="foot-link">Old Website</a></p>
						<p><a href="https://www.iitdh.ac.in/rti" className="foot-link">RTI</a></p>
						<p><a href="https://www.iitdh.ac.in/sc-st-obc-liaison-cell" className="foot-link">SC-ST-OBC Liaison Cell</a></p>
						<p><a href="https://www.iitdh.ac.in/tenders" className="foot-link">Tenders</a></p>
						<p><a href="https://www.iitdh.ac.in/videos" className="foot-link">Videos</a></p>
						<p><a href="https://drive.google.com/drive/folders/1IG-ASfdc2aIXtKoou-B1YfNNG-0hkQfv" className="foot-link">VPN Access</a></p>
					</div>
				</div>
				<hr className="mb-4 "/>
				<div className=" copyright row align-items-center">
					<div className=" col-md-7 col-lg-8 ">
						<p>	Copyright ©2024 All rights reserved by:</p>
					</div>
				</div>
		</footer>
    )
}

export default Footer