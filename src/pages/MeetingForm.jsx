import { useContext, useEffect, useState } from 'react';
import { Button, Container, Form, Modal, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchMeetingById, saveMeeting } from '../features/meetingsSlice';
import { AuthContext } from '../components/AuthProvider';

const MeetingForm = () => {
  const meeting = useSelector(state => state.meeting.meeting); // Select state.meeting.meeting
  const {currentUser} = useContext(AuthContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {meetingId} = useParams();


  useEffect(() => {
    if(!currentUser){
      navigate('/login');
    }
  },[currentUser])

  //Edit feature: fetch meeting detaiils
  useEffect(() => {
    if (meetingId){
      dispatch(fetchMeetingById(meetingId))
    }
  },[meetingId, dispatch])

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
  
  // Handle cover photo
  const handleFileChange = (event) => {
    dispatch(saveMeeting({ ...meeting, cover_photo: event.target.files[0] })); // Dispatch the saveMeeting action
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
          <Form.Group controlId="meetingName">
            <Form.Label>Meeting Name</Form.Label>
            <Form.Control type="text" name="meeting_name" value={meeting.meeting_name} onChange={handleChange} required/>
          </Form.Group>
          
          <Form.Group controlId="meetingLocation">
            <Form.Label>Meeting Location</Form.Label>
            <Form.Select name="location" value={meeting.location} onChange={handleChange} required>
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
              <option value="phone_call">Phone Call</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingDescription">
            <Form.Label>Meeting Description</Form.Label>
            <Form.Control type="text" name="description" value={meeting.description} onChange={handleChange} required/>
          </Form.Group>

          <Form.Group controlId="meetingCustomUrl">
            <Form.Label>Custom URL</Form.Label>
            <Form.Control type="text" name="custom_url" value={meeting.custom_url} onChange={handleChange} required/>
          </Form.Group>

          <Form.Group controlId="meetingCoverPhoto">
            <Form.Label>Cover Photo</Form.Label>
            <Form.Control type="file" name="cover_photo" onChange={handleFileChange} />
          </Form.Group>

          <Form.Group controlId="meetingEventDuration">
            <Form.Label>Event Duration</Form.Label>
            <Form.Select name="event_duration" value={meeting.event_duration} onChange={handleChange} required>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingTimeSlotIncrement">
            <Form.Label>Time Slot Increment</Form.Label>
            <Form.Select name="time_slot_increment" value={meeting.time_slot_increment} onChange={handleChange} required>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingDateRange">
            <Form.Label>Date Range</Form.Label>
            <Form.Select name="date_range" value={meeting.date_range} onChange={handleChange} required>
              <option value="3">3 days into the future</option>
              <option value="7">1 week into the future</option>
              <option value="30">1 month into the future</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="meetingReminderDays">
            <Form.Label>Email Reminder</Form.Label>
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
