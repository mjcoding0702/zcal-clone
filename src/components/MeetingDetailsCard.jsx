import { Button, Card, Col } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { deleteMeetingById } from "../features/meetingsSlice";
import { useNavigate } from "react-router-dom";

export default function MeetingDetailsCard({ name, duration, location, link, meetingId }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleCopyLink = async (event) => {
        event.preventDefault();
        try {
        await navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
        } catch (err) {
        console.error('Failed to copy link: ', err);
        }
    };

    const handleDelete = (meetingId) => {
        dispatch(deleteMeetingById(meetingId));
    }

    const handleNavigateEdit = (meetingId) => {
      navigate(`/meeting/${meetingId}`)
    }

  return (
    <>
      <Col xs={12} md={6} lg={4} className="mb-4">
        <Card>
          <Card.Body className="row justify-content-between align-items-end py-4 w-100">
            <div className="col-8">
              <i className="bi bi-person text-primary fs-4"></i>
              <Card.Title style={{
                height: '25px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                width: '100%', // Ensure it takes full width
                display: 'block' // Needed for the text-overflow to work
              }}>
                {name}
              </Card.Title>
              <Card.Text className="text-muted">
                {duration <= 60 ? `${duration} min`: `${duration/60} hour(s)`}
                <br /> 
                {location === 'zoom'? 'Zoom' : location === 'google_meet'? 'Google Meet' : 'Phone Call'}</Card.Text>
              <Card.Text className="text-muted" style={{ fontSize: "12px" }}>
                <a href={link} onClick={handleCopyLink} className="text-decoration-none">
                  <i className="bi bi-link-45deg me-1"></i>Copy Link
                </a>
              </Card.Text>
            </div>
            <div className="col-4 d-flex p-0 justify-content-end">
              <Button variant="primary">
                <i className="bi bi-pencil-square" onClick={() => handleNavigateEdit(meetingId)}></i>
              </Button>
              <Button variant="danger" className="ms-2">
                <i className="bi bi-trash" onClick={() => handleDelete(meetingId)}></i>
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
}
