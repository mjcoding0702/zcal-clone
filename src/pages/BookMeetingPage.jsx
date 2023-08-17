import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { createGuestMeeting, fetchGuestMeeting, fetchMeetingById, googleCalMeeting, sendEmail } from "../features/meetingsSlice";
import { Spinner } from "react-bootstrap";
import Button from '@mui/material/Button';
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Chip, InputBase, Paper, TextField } from "@mui/material";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

export default function BookMeetingPage() {
    const { meetingId } = useParams();
    const dispatch = useDispatch();
    const meeting = useSelector(state => state.meeting.meeting);
    const guestMeeting = useSelector(state => state.meeting.guestMeeting)
    const backupProfileURL = 'https://firebasestorage.googleapis.com/v0/b/clone-4b31b.appspot.com/o/profile-backup.png?alt=media&token=8a063fcb-f324-48c2-b66a-91f80f914a5a'

    const [submitting, setSubmitting] = useState(false); // Track submission status
    const [allowedDates, setAllowedDates] = useState([]);
    const [allowedTimeSlots, setAllowedTimeSlots] = useState({});
    const [value, setValue] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    //Use dayjs to format date & time
    dayjs.extend(utc);
    dayjs.extend(timezone);

    // Dispatch fetchGuestMeeting when the component mounts
    useEffect(() => {
        dispatch(fetchGuestMeeting(meetingId));
        dispatch(fetchMeetingById(meetingId));
    }, [dispatch, meetingId]);

    
    useEffect(() => {
      if (meeting && meeting.availability && guestMeeting) {
        const dates = [];
        const timeSlots = {};
    
        meeting.availability.forEach((avail) => {
          const date = dayjs(avail.date).format('YYYY-MM-DD');
          const startTime = dayjs(avail.start_time, 'HH:mm:ss');
          const endTime = dayjs(avail.end_time, 'HH:mm:ss');
    
          if (!dates.includes(date)) {
            dates.push(date);
          }
    
          if (!timeSlots[date]) {
            timeSlots[date] = [];
          }
    
          for (let time = startTime; time.isBefore(endTime); time = time.add(meeting.event_duration, 'minutes')) {
            const formattedTime = time.format('HH:mm');
            timeSlots[date].push(formattedTime);
          }
    
          // Filter out booked time slots for this date
          const bookedTimes = guestMeeting
            .filter(gm => dayjs(gm.booked_date).format('YYYY-MM-DD') === date)
            .map(gm => gm.booked_time.slice(0, 5)); // Extracting 'HH:mm' part
            timeSlots[date] = timeSlots[date].filter(time => !bookedTimes.includes(time));
        });
        setAllowedDates(dates);
        setAllowedTimeSlots(timeSlots);
      }
    }, [meeting, guestMeeting]);
    

    //Submit function
    const handleSubmit = async (e) => {
      e.preventDefault();
    
      if (!value) {
        alert('Please select a date and time.');
        return;
      }

      const selectedDateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const selectedTime = dayjs(value).format('HH:mm');
      const timeSlots = allowedTimeSlots[selectedDateStr];

      // Check if the selected time is not in the allowed time slots
      if (!timeSlots || !timeSlots.includes(selectedTime)) {
        alert('The selected time is not available. Please choose a different time.');
        return;
      }

      const bookedDate = dayjs(selectedDate).format('YYYY-MM-DD');
      const bookedTime = dayjs(value).format('HH:mm:ss');
    
      // Combine the main email with the guest emails
      const guestEmails = [email, ...emails].join(', ');

      const guestMeetingData = {
        meetingId,
        name,
        email,
        booked_date: bookedDate,
        booked_time: bookedTime,
        guestEmails: guestEmails
      };
    
      //Email content
      const durationString = meeting.event_duration <= 60 ? `${meeting.event_duration} min` : `${meeting.event_duration / 60} hour(s)`;
      const subject = `Appointment Confirmation - ${meeting.meeting_name}`;
      const content = `
        <html>
          <body>
            <p>Hello from zCal Clone! This is a confirmation email for your appointment with details as follows:</p>
            <p>Booking name: ${name}</p>
            <p>Attendees: ${guestEmails}</p>
            <p>Booked Date: ${bookedDate}</p>
            <p>Booked Time: ${bookedTime}</p>
            <p>Duration: ${durationString}</p>
            <p>Location: ${meeting.location}</p>
            <p>Meeting URL: ${meeting.custom_url}</p>
            <br>
            <p>Looking forward to see you!</p>
            <br>
            <p>Regards,<br>${meeting.user_name}</p>
          </body>
        </html>
      `;

      //Zapier google calander content
      const eventDuration = meeting.event_duration;

      // Concatenate the date and time
      const startDateTimeLocal = `${bookedDate}T${bookedTime}`;

      // Create a dayjs object with the desired timezone offset
      const startDateTimeWithTimezone = dayjs(startDateTimeLocal).tz('Asia/Singapore'); // for GMT+8

      // Format the date-time strings, including the timezone offset
      const startDateTime = startDateTimeWithTimezone.format(); // Will be in the format 2023-08-23T10:00:00+08:00
      const endDateTime = startDateTimeWithTimezone.add(eventDuration, 'minutes').format();

      // Create the Google Calendar data
      const googleCalData = {
        summary: meeting.meeting_name,
        description: meeting.description,
        location: meeting.custom_url,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        attendees: guestEmails,
        reminder: (meeting.reminder_days).toString()
      };

      setSubmitting(true); // Set submitting to true to disable the button and change the text
    
      try {
        await dispatch(createGuestMeeting({ guestMeetingData })); // Dispatch the action
        await dispatch(sendEmail({to: guestEmails, subject, html: content})); // Notice the change to html
        await dispatch(googleCalMeeting(googleCalData))
      
        alert("Booked successfully! Confirmation email has been sent!");
        window.location.reload();
      } catch (error) {
        console.error(error);
        alert("There was an error booking the meeting or sending the email. Please try again.");
      } finally {
        setSubmitting(false); // Set submitting to false to re-enable the button
      }
    };
    

    //Disable date and time that were booked & unavailable
    const [selectedDate, setSelectedDate] = useState(null);
    const [timePickerEnabled, setTimePickerEnabled] = useState(false);

    const shouldDisableDate = (date) => {
      const formattedDate = dayjs(date).format('YYYY-MM-DD');
      return !allowedDates.includes(formattedDate);
    };
  
    const shouldDisableTime = (value, view) => {
      if (!value) return true; // Disable time if value is not defined
    
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const timeSlots = allowedTimeSlots[dateStr];
      if (!timeSlots) return true;
    
      if (view === 'hours') {
        const hour = dayjs(value).hour();
        const disableHour = !timeSlots.some(slot => parseInt(slot.split(':')[0]) === hour);
        if (disableHour) {
          console.log(`Hour disabled: ${hour} for date ${dateStr}`);
        }
        return disableHour;
      }
    
      if (view === 'minutes') {
        const timeStr = dayjs(value).format('HH:mm');
        const isDisabled = !timeSlots.includes(timeStr);
    
        if (isDisabled) {
          console.log(`Time slot disabled: ${timeStr} for date ${dateStr}`);
        }
        return isDisabled;
      }
      return false;
    };
    
    //Guest Emails
    const [emails, setEmails] = useState([]);
    const [inputValue, setInputValue] = useState('');
    
    const handleInputChange = (e) => {
      setInputValue(e.target.value);
    };
  
    const handleAddEmail = () => {
      if (inputValue.trim() === '') return; // Return early if the input is empty
    
      const email = inputValue.trim();
      const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
      if (isValidEmail) {
        setEmails([...emails, email]);
        setInputValue('');
      } else {
        alert('Please enter a valid email address.');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddEmail();
      }
    };
  
    const handleRemoveEmail = (index) => {
      setEmails(emails.filter((_, i) => i !== index));
    };

    return (
      <>
        <style>
          {`
            body {
              background-color: #ececec;
            }
            .MuiDialogActions-root{
              display: none;
            }
          `}
        </style>
        {(meeting.length === 0)? (
          <Spinner animation="border" variant="primary" />
        ): (
          <form onSubmit={handleSubmit}>
            <div className="container d-flex justify-content-center align-items-center min-vh-100" style={{maxWidth: '1200px'}}>
              <div className="row border p-3 bg-white shadow rounded-5 w-100">
                <div className="profile col-12 col-md-4 col-xl-5 p-3 border">
                  <img src={(meeting && meeting.profile_picture) || backupProfileURL} alt="rexlogo" className="img-fluid" style={{width: '70px'}}/>
                  <div className="mt-3">
                    <h1 className="fs-4">{(meeting && meeting.meeting_name) || 'Loading...'}</h1>
                    <div className="mt-4">
                      <div className="d-flex">
                        <i className="bi bi-person me-2"></i>
                        <p className="text-muted mb-2">{(meeting && meeting.userName) || 'Loading...'}</p>
                      </div>
                      <div className="d-flex">
                        <i className="bi bi-clock me-2"></i>
                        <p className="text-muted mb-2">{meeting ? `${meeting.event_duration} ${meeting.event_duration > 60 ? 'hour' : 'minutes'}` : 'Loading...'}</p>
                      </div>
                      <div className="d-flex">
                        <i className="bi bi-geo-alt me-2"></i>
                        <p className="text-muted mb-2">{(meeting && meeting.location) || 'Loading...'}</p>
                      </div>
                      <div className="d-flex">
                        <i className="bi bi-link-45deg me-2"></i>
                        <p className="text-muted mb-2">{(meeting && meeting.custom_url) || 'Loading...'}</p>
                      </div>
                    </div>
                    <hr></hr>
                    <p>{(meeting && meeting.description) || 'Loading...'}</p>
                  </div>
                </div>

                <div className="booking col-md-8 col-xl-7 bg-white p-3">
                    <h3 className="mb-3">Book your meeting {meeting && meeting.userName && `with ${meeting.userName}`}</h3>
                    <TextField
                      label="Name"
                      variant="outlined"
                      className="mb-3"
                      fullWidth
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <TextField
                      label="Email"
                      variant="outlined"
                      className="mb-3"
                      fullWidth
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                      <div style={{ position: 'relative', marginBottom: '20px' }}>
                      <TextField
                        label="Enter guest email (optional)"
                        variant="outlined"
                        fullWidth
                        className="mb-3"
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onBlur={handleAddEmail} // Add this line
                      />
                      {emails.length > 0 && (
                        <Paper
                          variant="outlined"
                          style={{
                            display: 'flex',
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                            padding: '5px',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          {emails.map((email, index) => (
                            <Chip
                              key={index}
                              label={email}
                              onDelete={() => handleRemoveEmail(index)}
                              style={{ margin: '5px' }}
                            />
                          ))}
                          <InputBase style={{ minWidth: '100px' }} disabled/>
                        </Paper>
                      )}
                    </div>
                    <p className="ms-1 mb-3">Select your preferred date:</p>
                    <div className="w-100 d-flex justify-content-between">
                        <DatePicker
                        label="Select Date"
                        value={selectedDate}
                        className="w-100"
                        onChange={(newValue) => {
                          setSelectedDate(newValue);
                          setTimePickerEnabled(true); // Enable time picker once a date is selected
                        }}
                        shouldDisableDate={shouldDisableDate}
                      />
                      {timePickerEnabled && (
                        <TimePicker
                          label="Select Time"
                          value={value}
                          className="ms-3 w-100"
                          onChange={(newValue) => setValue(newValue)}
                          shouldDisableTime={shouldDisableTime}
                        />
                      )}
                    </div>
                    <div className="d-flex justify-content-end">
                      <Button
                        type="submit"
                        variant="contained"
                        className="mt-3"
                        color="primary"
                        disabled={submitting} 
                      >
                        {submitting ? 'Submitting...' : 'Submit'} 
                      </Button>
                    </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </>
    );
}


 