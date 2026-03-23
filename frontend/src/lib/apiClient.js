import axios from 'axios';
import { supabase } from '@/lib/supabase';

// Vite relies on import.meta.env for env variables.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject the Supabase JWT into every API call
client.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
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

    getEducatorCourses: async (educatorId) => {
        try {
            const response = await client.get(`/api/courses?educator_id=${educatorId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching courses for educator ${educatorId}:`, error);
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

export const CourseAPI = {
    generateGraph: async (skillsList) => {
        try {
            const response = await client.post('/api/courses/generate', { skills: skillsList });
            return response.data;
        } catch (error) {
            console.error('Error in CourseAPI.generateGraph:', error);
            throw error;
        }
    },
    deployCourse: async (payload) => {
        try {
            const response = await client.post('/api/courses/deploy', payload);
            return response.data;
        } catch (error) {
            console.error('Error in CourseAPI.deployCourse:', error);
            throw error;
        }
    }
};

export const StudentService = {
    enroll: async (studentId, courseId) => {
        try {
            const response = await client.post('/api/student/enroll', { student_id: studentId, course_id: courseId });
            return response.data;
        } catch (error) {
            console.error('Error enrolling student:', error);
            throw error;
        }
    },
    getEnrolledCourses: async (studentId) => {
        try {
            const response = await client.get(`/api/student/${studentId}/courses`);
            return response.data;
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            throw error;
        }
    },
    getProgress: async (studentId, courseId) => {
        try {
            const response = await client.get(`/api/student/${studentId}/course/${courseId}/progress`);
            return response.data;
        } catch (error) {
            console.error('Error fetching student progress:', error);
            throw error;
        }
    },
    updateProgress: async (payload) => {
        try {
            const response = await client.post('/api/student/progress', payload);
            return response.data;
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    }
};

export const QuizService = {
    generateQuiz: async (courseTitle, skillName) => {
        try {
            const response = await client.post('/api/quiz/generate', { course_title: courseTitle, skill_name: skillName });
            return response.data;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
        }
    }
};

export default client;
