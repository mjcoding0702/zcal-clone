import { Badge, Button, Card, CardGroup, Col, Container, Nav, NavDropdown, Navbar, OverlayTrigger, Row, Spinner, Tooltip } from "react-bootstrap";
import { useContext, useEffect } from "react";
import { AuthContext } from "../components/AuthProvider";
import { useNavigate } from "react-router-dom";
import MeetingDetailsCard from "../components/MeetingDetailsCard";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetingsByUser, fetchUser } from "../features/meetingsSlice";


export default function Home() {
    const navigate = useNavigate();
    const {currentUser} = useContext(AuthContext);
    const dispatch = useDispatch();
    const user = useSelector(state => state.meeting.user);

    //Log user out
    useEffect(() => {
        if(!currentUser){
         navigate('/login');
        } else {
            dispatch(fetchMeetingsByUser(currentUser.uid));
            dispatch(fetchUser(currentUser.uid));
        }
    },[currentUser, navigate])

    //Get meeting details from redux store
    const allMeetings = useSelector(state => state.meeting.allMeetings);
    const loading = useSelector(state => state.meeting.loading)

    const handleCreateMeeting = () => {
        navigate('/meeting')
    }
    
    return (
        <>
            <Container>
                <Row className="my-4 d-flex align-items-center">
                    <Col xs={7}>
                        <h1 className="fs-3 fs-md-2 fs-lg-1">{user && user.userDetails && (
                            `Welcome back, ${user.userDetails.name}`
                        )}</h1>
                    </Col>

                    <Col xs={5} className="d-flex align-items-center justify-content-end">
                        <Button variant="primary" onClick={handleCreateMeeting}>+ New Link</Button>
                    </Col>
                </Row>  

                <Row className="my-5">
                    <Col>
                        <span className="fw-medium fs-4 me-2">Invites</span>
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip>
                                    These invites are available for booking new appointments
                                </Tooltip>
                            }
                        >
                            <i className="bi bi-info-circle" style={{ opacity: 0.5 }}></i>
                        </OverlayTrigger>
                    </Col>

                    <Col className="d-flex align-items-center justify-content-end">
                        <a href="#" className="text-blue text-decoration-none">View all invites</a>
                    </Col>
                </Row>  

                <Row className="px-2">
                    {loading ? (
                        <Spinner animation="border" variant="primary" />
                    ) : allMeetings && allMeetings.length > 0 ? (
                        allMeetings.map((meeting) => (
                            <MeetingDetailsCard 
                                key={meeting.id}
                                meetingId={meeting.id}
                                name={meeting.meeting_name}
                                duration={meeting.event_duration}
                                location={meeting.location}
                                link={`${window.location.origin}/bookmeeting/${meeting.id}`}
                            />
                        ))
                    ) : (
                        <p>You have no meetings yet. Click the New Link button to create one!</p>
                    )}
                </Row>

  
            </Container> 
        </>
    )
}