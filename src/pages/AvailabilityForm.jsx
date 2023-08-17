import { useState, useEffect, useContext } from 'react';
import { Form, Button, Modal, Table, Container, Col, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { format, eachDayOfInterval, isWeekend } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchUser, postMeetingData, updateMeetingData } from '../features/meetingsSlice';
import { AuthContext } from '../components/AuthProvider';
import { groupBy } from 'lodash';

function AvailabilityForm() {
  const {currentUser} = useContext(AuthContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const meeting = useSelector(state => state.meeting.meeting);
  const {meetingId} = useParams();
  const [availability, setAvailability] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const groupedAvailability = groupBy(availability.flatMap(dateAvailability => dateAvailability.slots.map(slot => ({ ...slot, date: dateAvailability.date }))), 'date'); // Group the slots by date

  //Log user out
  useEffect(() => {
    if(!currentUser){
      navigate('/login');
    } else {
      dispatch(fetchUser(currentUser.uid));
    }
  },[currentUser])

  //Load the date within user specified range
  useEffect(() => {
    if (meeting && meeting.date_range && meeting.meeting_name) {
      let initialAvailability;
      if (meeting.availability) {
        // Group the availability objects by date
        const groupedAvailability = groupBy(meeting.availability, 'date');
  
        // Create a slot for each availability object
        initialAvailability = Object.entries(groupedAvailability).map(([date, availabilities]) => ({
          date: format(new Date(date), 'yyyy-MM-dd'),
          slots: availabilities.map(avail => ({
            id: avail.id,
            start_time: avail.start_time.substring(0, 5),
            end_time: avail.end_time.substring(0, 5),
            repeats: ''
          })),
        }));
      } else {
        // Initialize the availability data
        const dates = eachDayOfInterval({
          start: new Date(),
          end: new Date(new Date().getTime() + meeting.date_range * 24 * 60 * 60 * 1000)
        });
  
        initialAvailability = dates.map(date => ({
          date: format(date, 'yyyy-MM-dd'),
          slots: [
            {
              id: null,
              start_time: isWeekend(date) ? '' : '09:00',
              end_time: isWeekend(date) ? '' : '17:00',
              repeats: ''
            },
          ],
        }));
      }
      setAvailability(initialAvailability);
    } 
  }, [meeting]);
  

  //Generate time slot for availability page
  const generateTimeOptions = (increment) => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60 / increment; j++) {
        const hour = i.toString().padStart(2, '0');
        const minuteValue = (j * increment) % 60;
        const minute = minuteValue.toString().padStart(2, '0');
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  };
  const timeOptions = generateTimeOptions(meeting.time_slot_increment);
  
  
  //Handle Time Change
  const handleTimeChange = (dateIndex, slotIndex) => {
    const newAvailability = [...availability];
    const selectedDay = format(new Date(newAvailability[dateIndex].date), 'EEEE').toLowerCase();
    const selectedStartTime = newAvailability[dateIndex].slots[slotIndex].start_time;
    const selectedEndTime = newAvailability[dateIndex].slots[slotIndex].end_time;
  
    switch (newAvailability[dateIndex].slots[slotIndex].repeats) {
      case 'daily':
        newAvailability.forEach(day => {
          if (format(new Date(day.date), 'EEEE').toLowerCase() === selectedDay) {
            day.slots.forEach(slot => {
              slot.start_time = selectedStartTime;
              slot.end_time = selectedEndTime;
            });
          }
        });
        break;
      case 'weekdays':
        newAvailability.forEach(day => {
          if (!isWeekend(new Date(day.date))) {
            day.slots.forEach(slot => {
              slot.start_time = selectedStartTime;
              slot.end_time = selectedEndTime;
            });
          }
        });
        break;
      default:
        break;
    }
    setAvailability(newAvailability);
  };

  // Add a new slot for a date
  const addSlotInModal = () => {
    const newAvailability = [...availability];
    newAvailability[currentSlot.dateIndex].slots.push({
      start_time: '',
      end_time: '',
    });
    setAvailability(newAvailability);
  };

  // Delete a slot for a date
  const deleteSlotInModal = (slotIndex) => {
    const newAvailability = [...availability];
    const slots = newAvailability[currentSlot.dateIndex].slots;
    if (slots.length > 1) {
      slots.splice(slotIndex, 1);
    } else {
      slots[0].start_time = '';
      slots[0].end_time = '';
      slots[0].repeats = '';
    }
    setAvailability(newAvailability);
  };
  
  //Handle Change
  const handleChange = (dateIndex, slotIndex, event) => {
    const newAvailability = [...availability];
    const slot = newAvailability[dateIndex].slots[slotIndex];
    const previousValue = slot[event.target.name]; // Store the previous value
    slot[event.target.name] = event.target.value;
  
    if (event.target.name === 'start_time' && slot.end_time) {
      const startTime = slot.start_time;
      const endTime = slot.end_time;
  
      if (startTime && endTime && startTime >= endTime) {
        alert(`Start time must be before end time for date index ${dateIndex} and slot index ${slotIndex}`);
        slot.start_time = previousValue; // Revert to the previous value
      } else {
        handleTimeChange(dateIndex, slotIndex);
      }
    }
    setAvailability(newAvailability);
  };
  
  //Navigate user back to meeting page
  const handleBack = () => {
    navigate(-1);
  }

  //Show and Close Modal
  const handleShowModal = (dateIndex) => {
    setCurrentSlot({ dateIndex, slots: availability[dateIndex].slots });
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setCurrentSlot(null);
    setShowModal(false);
  };

  //Track submission status
  const [isSubmitting, setIsSubmitting] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true)
  
    // Create a deep copy of the availability array
    const availabilityCopy = JSON.parse(JSON.stringify(availability));
  
    // Remove the "repeats" field from each slot
    availabilityCopy.forEach(dateAvailability => {
      dateAvailability.slots.forEach((slot, slotIndex) => {
        delete slot.repeats;
      });
    });
  
    const meetingData = {
      meeting: meeting,
      availability: availabilityCopy
    };
  
    console.log("meeting data from availability form")
    console.log(meetingData)
  
    if (meetingId) {
      // Update the existing meeting
      const response = await dispatch(updateMeetingData({ id: meetingId, meetingData }));
      if (updateMeetingData.fulfilled.match(response)) {
        navigate(`/success/${meetingId}`);
      }
    } else {
      // Create a new meeting
      const response = await dispatch(postMeetingData(meetingData));
      if (postMeetingData.fulfilled.match(response)) {
        const meetingId = response.payload.meeting_id; // replace this with the actual ID of the created meeting
        setIsSubmitting(false) // Change submission status once done
        navigate(`/success/${meetingId}`);
      }
    }
  };
  
  return (
    <Container>
        <Form onSubmit={handleSubmit}>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Start Time - End Time</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedAvailability).map(([date, slots], dateIndex) => (
                <tr key={dateIndex}>
                  <td>{date}</td>
                  <td>
                    {slots.map((slot, slotIndex) => (
                      <div key={slotIndex} onClick={() => handleShowModal(dateIndex)}>
                        {`${slot.start_time} - ${slot.end_time}`}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
              {!meeting.meeting_name && (
                <tr>
                  <td colSpan={2}>Click back to create a meeting before setting availability timeslot</td>
                </tr>
              )}
            </tbody>
          </Table>
        
          <Modal show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>Edit Availability</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {currentSlot && availability[currentSlot.dateIndex] && (
                <>
                  <Form.Group controlId={`date${currentSlot.dateIndex}`}>
                    <Form.Label>Date</Form.Label>
                    <Form.Control type="date" name="date" value={availability[currentSlot.dateIndex]?.date} disabled />
                  </Form.Group>
                  {currentSlot && currentSlot.slots.map((slot, slotIndex) => (
                    <Row key={slotIndex}>
                      <Col>
                        <Form.Group controlId={`startTime${currentSlot.dateIndex}${slotIndex}`}>
                          <Form.Label>Start Time</Form.Label>
                          <Form.Control as="select" name="start_time" value={slot.start_time} onChange={(event) => handleChange(currentSlot.dateIndex, slotIndex, event)}>
                            {timeOptions.map((time, index) => (
                              <option key={index} value={time}>{time}</option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group controlId={`endTime${currentSlot.dateIndex}${slotIndex}`}>
                          <Form.Label>End Time</Form.Label>
                          <Form.Control as="select" name="end_time" value={slot.end_time} onChange={(event) => handleChange(currentSlot.dateIndex, slotIndex, event)}>
                            {timeOptions.slice(1).map((time, index) => (
                              <option key={index} value={time}>{time}</option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                      </Col>
                      <Col xs="auto" className='d-flex align-items-end'>
                        <Button variant="danger" onClick={() => deleteSlotInModal(slotIndex)}>Delete</Button>
                      </Col>
                    </Row>
                  ))}
                  <Form.Group controlId={`repeats${currentSlot.dateIndex}`}>
                    <Form.Label>Repeats</Form.Label>
                    <Form.Control as="select" name="repeats" value={availability[currentSlot.dateIndex]?.slots[0]?.repeats} onChange={(event) => handleChange(currentSlot.dateIndex, 0, event)}>
                      <option value="only">{`Only on ${format(new Date(availability[currentSlot.dateIndex].date), 'MMMM do')}`}</option>
                      <option value="daily">{`Every ${format(new Date(availability[currentSlot.dateIndex].date), 'EEEE')}`}</option>
                      <option value="weekdays">All weekdays</option>
                    </Form.Control>
                  </Form.Group>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Close
              </Button>
              <Button variant="primary" onClick={handleCloseModal}>
                Save Changes
              </Button>
              {currentSlot && (
                <Button onClick={addSlotInModal}>New Interval</Button>
              )}
            </Modal.Footer>
          </Modal>
        
          <Button variant='primary' onClick={handleBack} className='me-2 px-3' disabled={isSubmitting}>
              Back
          </Button>
          {meeting.meeting_name && (
            <Button variant="success" type="submit" disabled={isSubmitting}>
              {isSubmitting? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </Form>
    </Container>
  );
}

export default AvailabilityForm;