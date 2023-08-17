import { useContext, useEffect, useState } from 'react';
import { Button, Container, Form, Modal, OverlayTrigger, Spinner, Tooltip } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchMeetingById, fetchUser, saveMeeting } from '../features/meetingsSlice';
import { AuthContext } from '../components/AuthProvider';

const MeetingForm = () => {
  const meeting = useSelector(state => state.meeting.meeting); 
  const {currentUser} = useContext(AuthContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {meetingId} = useParams();

  useEffect(() => {
    if(!currentUser){
      navigate('/login');
    } else {
      dispatch(fetchUser(currentUser.uid));
    }
  },[currentUser, navigate, dispatch])

  //Edit feature: fetch meeting detaiils
  useEffect(() => {
    if (meetingId){
      dispatch(fetchMeetingById(meetingId))
    }
  },[meetingId, dispatch])

  //Handle Change will save all fields to synchronous state
  const handleChange = (event) => {
    const { name, value } = event.target;
    let convertedValue = value;
  
    // Convert duration and increment to minutes
    if (name === 'event_duration' || name === 'time_slot_increment') {
      const number = parseInt(value);
      if (value.includes('mins')) {
        convertedValue = number;
      } else if (value.includes('hour')) {
        convertedValue = number * 60;
      }
    }
  
    // Convert date range to days
    if (name === 'date_range') {
      const number = parseInt(value);
      if (value.includes('day')) {
        convertedValue = number;
      } else if (value.includes('week')) {
        convertedValue = number * 7;
      } else if (value.includes('month')) {
        convertedValue = number * 30; // Approximate, actual number of days in a month can vary
      }
    }

    //Convert reminder days to integer
    if (name === 'reminder_days'){
      convertedValue = parseInt(value);
    }
  
    dispatch(saveMeeting({ ...meeting, [name]: convertedValue, user_uid: currentUser.uid }));  
  };
  
  //After user clicked "next" button, bring them to continue filling up form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (meetingId){
      navigate(`/availability/${meetingId}`);
    } else {
      navigate('/availability');
    }
  };

  return (
    <>
      <Container>
        <h1 className='mb-4'>Create a meeting invite link!</h1>
          <Form onSubmit={handleSubmit}>
          <Form.Group controlId="meetingName" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        The name will be shown on your invite page and in your calendar event
                    </Tooltip>
                }
            >
              <Form.Label>Meeting Name<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Control type="text" name="meeting_name" value={meeting.meeting_name} onChange={handleChange} required placeholder="Eg: React 1hr"/>
          </Form.Group>
          
          <Form.Group controlId="meetingLocation" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        Where the meeting will take place
                    </Tooltip>
                }
            >
              <Form.Label>Meeting Location<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Select name="location" value={meeting.location} onChange={handleChange} required>
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingDescription" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        The description is shown on your invite page and in your calendar event.
                    </Tooltip>
                }
            >
              <Form.Label>Meeting Description<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Control type="text" name="description" value={meeting.description} onChange={handleChange} required placeholder="Eg: In this call, we will be discussing topics related to ReactJS. Hope to talk to you real soon!"/>
          </Form.Group>

          <Form.Group controlId="meetingCustomUrl" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        Add your customized meeting link URL, eg: Your Zoom meeting link
                    </Tooltip>
                }
            >
              <Form.Label>Custom URL<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Control type="text" name="custom_url" value={meeting.custom_url} onChange={handleChange} required placeholder='Eg: https://your-meeting-link.com'/>
          </Form.Group>

          <Form.Group controlId="meetingEventDuration" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        How long the meeting will take. It can be as short as 15 minutes or as long as 3 hours
                    </Tooltip>
                }
            >
              <Form.Label>Event Duration<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Select name="event_duration" value={meeting.event_duration} onChange={handleChange} required>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingTimeSlotIncrement" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        How frequently time slots are displayed. For example, a 30 minute increment creates slots 9:00am, 9:30am, 10:00am... while a 60 minute increment create slots 9:00am, 10:00am, 11:00am...
                    </Tooltip>
                }
            >
              <Form.Label>Time Slot Increment<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Select name="time_slot_increment" value={meeting.time_slot_increment} onChange={handleChange} required>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingDateRange" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        The dates when the meeting can be scheduled by your guests.
                    </Tooltip>
                }
            >
              <Form.Label>Date Range<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Select name="date_range" value={meeting.date_range} onChange={handleChange} required>
              <option value="3">3 days into the future</option>
              <option value="7">1 week into the future</option>
              <option value="30">1 month into the future</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingReminderDays" className='mb-3'>
            <OverlayTrigger
                placement="right"
                overlay={
                    <Tooltip>
                        Send a reminder email to event attendees before they are scheduled to meet with you
                    </Tooltip>
                }
            >
              <Form.Label>Email Reminder<i className="bi bi-info-circle ms-2" style={{ opacity: 0.5 }}></i></Form.Label>
            </OverlayTrigger>
            <Form.Select name="reminder_days" value={meeting.reminder_days} onChange={handleChange} required>
              <option value="30">30 minutes before the meeting</option>
              <option value="60">60 minutes before the meeting</option>
              <option value="120">120 minutes before the meeting</option>
            </Form.Select>
          </Form.Group>


          <Button variant="primary" type="submit" className='mt-3'>
            Next
          </Button>
        </Form>
      </Container>

    </>
  );
};

export default MeetingForm;
