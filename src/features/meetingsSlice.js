// meetingSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

//Async thunk to send both 'meetings' and 'availability' data to backend
export const postMeetingData = createAsyncThunk(
  'meeting/postMeetingData',
  async (meetingData, thunkAPI) => {
    try {
      let imageURL = "";

      if (meetingData.meeting.cover_photo) {
        const imageRef = ref(storage, `meetings/${meetingData.meeting.cover_photo.name}`);
        const response = await uploadBytes(imageRef, meetingData.meeting.cover_photo);
        imageURL = await getDownloadURL(response.ref);
      }

      // Flatten the availability data structure and filter out dates without timeslots
      const flattenedAvailability = meetingData.availability.flatMap(date => (
        date.slots.map(slot => ({
          date: date.date,
          start_time: slot.start_time || null, // Set to null if not provided
          end_time: slot.end_time || null, // Set to null if not provided
          repeats: slot.repeats,
        }))
      )).filter(slot => slot.start_time && slot.end_time); // Only include slots with both start_time and end_time

      const response = await axios.post('https://capstone-project-api.chungmangjie200.repl.co/meetings', {
        ...meetingData,
        meeting: {
          ...meetingData.meeting,
          cover_photo: imageURL,
        },
        availability: flattenedAvailability,
      });

      // Remove the File object from the state
      thunkAPI.dispatch(saveMeeting({ ...meetingData.meeting, cover_photo: imageURL }));

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({ error: error.message });
    }
  }
);


//Async thunk to fetch meeting ID
export const fetchMeetingById = createAsyncThunk(
    'meetings/fetchMeetingById',
    async(meetingId) => {
        const response = await axios.get(`https://capstone-project-api.chungmangjie200.repl.co/api/meetings/${meetingId}`);
        console.log(response)
        return response.data
    }
)
  
//Async thunk to fetch all meetings details
export const fetchMeetingsByUser = createAsyncThunk(
  'meetings/fetchMeetingsByUser',
  async(userUid) => {
    try {
      const response = await axios.post(`https://capstone-project-api.chungmangjie200.repl.co/api/meetings`, { userUid });
      return response.data
    } catch(error){
      console.log(error)
    }
  }
)

//Async thunk to delete a specific meeting & cascade to other tables as well
export const deleteMeetingById = createAsyncThunk(
  'meetings/deleteMeetingById',
  async(meetingId) => {
    try {
      await axios.delete(`https://capstone-project-api.chungmangjie200.repl.co/meetings/${meetingId}`);
      return meetingId
    } catch(error){
      console.log(error)
    }
  }
)


//Synchronous 
const meetingSlice = createSlice({
  name: 'meeting',
  initialState: {
    meeting: {
      meeting_name: '',
      location: 'zoom',
      description: '',
      custom_url: '',
      cover_photo: '',
      event_duration: '30',
      time_slot_increment: '30',
      date_range: '7',
      reminder_days: '1',
      user_uid: '',
    },
    loading: true, // add loading to track request status
    allMeetings: {},
  },
  reducers: {
    saveMeeting: (state, action) => {
      state.meeting = action.payload;
    },
    resetMeeting: (state) => {
      state.meeting = {
        meeting_name: '',
        location: '',
        description: '',
        custom_url: '',
        cover_photo: '',
        event_duration: '',
        time_slot_increment: '',
        date_range: '',
        reminder_days: '',
        user_uid: '',
      };
    },
  },
  //Asynchronous
  extraReducers: (builder) => {
    builder
      .addCase(postMeetingData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add any other state changes you need on success
      })
      .addCase(fetchMeetingById.fulfilled, (state,action) => {
        state.loading = false;
        state.meeting = action.payload;
      })
      .addCase(fetchMeetingsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.allMeetings = action.payload
      })
      .addCase(deleteMeetingById.fulfilled, (state, action) => {
        const meetingId = action.payload

        state.allMeetings = state.allMeetings.filter((meeting) => meeting.id !== meetingId)
      })
  }
});

export const { saveMeeting, resetMeeting } = meetingSlice.actions;

export default meetingSlice.reducer;
