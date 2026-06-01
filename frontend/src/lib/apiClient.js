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

export const MaterialAPI = {
    createMaterial: async (skillId, payload) => {
        try {
            const response = await client.post(`/api/skills/${skillId}/materials`, payload);
            return response.data;
        } catch (error) {
            console.error('Error creating material:', error);
            throw error;
        }
    },
    deleteMaterial: async (materialId) => {
        try {
            const response = await client.delete(`/api/materials/${materialId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting material:', error);
            throw error;
        }
    },
    updateMaterial: async (materialId, payload) => {
        try {
            const response = await client.put(`/api/materials/${materialId}`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating material:', error);
            throw error;
        }
    }
};

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
    generateGraph: async (skillsList, field = 'python') => {
        try {
            const response = await client.post('/api/courses/generate', { skills: skillsList, field });
            return response.data;
        } catch (error) {
            console.error('Error in CourseAPI.generateGraph:', error);
            throw error;
        }
    },
    parseSkills: async (rawText, formatHint = 'csv') => {
        try {
            const response = await client.post('/api/courses/parse-skills', {
                raw_text: rawText,
                format_hint: formatHint
            });
            return response.data;
        } catch (error) {
            console.error('Error in CourseAPI.parseSkills:', error);
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
    },
    updateSkillSettings: async (skillId, settings) => {
        try {
            const response = await client.put(`/api/skills/${skillId}`, settings);
            return response.data;
        } catch (error) {
            console.error('Error updating skill settings:', error);
            throw error;
        }
    },
    updateCourseSettings: async (courseId, settings) => {
        try {
            const response = await client.put(`/api/courses/${courseId}/settings`, settings);
            return response.data;
        } catch (error) {
            console.error('Error updating course settings:', error);
            throw error;
        }
    },
    updateCourseGraph: async (courseId, payload) => {
        try {
            const response = await client.put(`/api/courses/${courseId}/graph`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating course graph:', error);
            throw error;
        }
    },
    fetchYoutubeRecommend: async (skillId, courseTitle = '', skillName = '') => {
        try {
            const response = await client.get(`/api/skills/${skillId}/youtube-recommend`, {
                params: { course_title: courseTitle, skill_name: skillName }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching YouTube recommendation:', error);
            return [];
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
    unenroll: async (studentId, courseId) => {
        try {
            const response = await client.delete(`/api/student/${studentId}/course/${courseId}`);
            return response.data;
        } catch (error) {
            console.error('Error unenrolling student:', error);
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
    },
    getCourseRoster: async (courseId) => {
        try {
            const response = await client.get(`/api/student/roster/${courseId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching course roster:', error);
            throw error;
        }
    }
};

export const QuizService = {
    generateQuiz: async ({ courseTitle, skillName, skillId, courseId, numQuestions = 20, masteredPrerequisites = [], signal }) => {
        try {
            const response = await client.post('/api/quiz/generate', {
                course_title: courseTitle,
                skill_name: skillName,
                skill_id: skillId,
                course_id: courseId,
                num_questions: numQuestions,
                mastered_prerequisites: masteredPrerequisites
            }, { signal });
            return response.data;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
        }
    },
    submitQuiz: async (payload) => {
        try {
            const response = await client.post('/api/quiz/submit', payload);
            return response.data;
        } catch (error) {
            console.error('Error submitting quiz:', error);
            throw error;
        }
    },
    getHistory: async (studentId, skillId) => {
        try {
            const response = await client.get(`/api/quiz/history/${studentId}/${skillId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching quiz history:', error);
            throw error;
        }
    },
    getCourseHistory: async (courseId) => {
        try {
            const response = await client.get(`/api/quiz/history/course/${courseId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching course quiz history:', error);
            throw error;
        }
    }
};

export default client;
