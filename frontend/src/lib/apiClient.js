import axios from 'axios';

// Vite relies on import.meta.env for env variables.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const CourseService = {
    getAllCourses: async () => {
        try {
            const response = await client.get('/api/courses');
            return response.data;
        } catch (error) {
            console.error('Error fetching courses:', error);
            throw error;
        }
    },

    getCourseGraph: async (courseId) => {
        try {
            const response = await client.get(`/api/courses/${courseId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching course graph for ${courseId}:`, error);
            throw error;
        }
    },

    createCourse: async (data) => {
        try {
            const response = await client.post('/api/courses', data);
            return response.data;
        } catch (error) {
            console.error('Error creating course:', error);
            throw error;
        }
    }
};

export default client;
