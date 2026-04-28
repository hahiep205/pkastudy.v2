import { useState } from 'react';

const CUSTOM_KEY = 'pka_custom_courses';

const cloneCourses = (courses) => JSON.parse(JSON.stringify(courses));
const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const getInitialCourses = () => {
    try {
        return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
    } catch {
        return [];
    }
};

const getLatestCourses = () => {
    try {
        return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
    } catch {
        return [];
    }
};

export function useCustomCourses() {
    const [customCourses, setCustomCourses] = useState(getInitialCourses);

    const loadCourses = () => {
        try {
            const data = JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
            setCustomCourses(data);
            return data;
        } catch {
            setCustomCourses([]);
            return [];
        }
    };

    const saveCourses = (courses) => {
        setCustomCourses(courses);
        localStorage.setItem(CUSTOM_KEY, JSON.stringify(courses));
    };

    // --- TOPIC CRUD --- //
    const createTopic = ({ title, description, lang }) => {
        const courses = [...getLatestCourses()];
        const newTopic = {
            id: createId('custop'),
            title,
            description,
            lang: lang || 'en',
            words: []
        };
        courses.push(newTopic);
        saveCourses(courses);
        return newTopic;
    };

    const updateTopic = (topicId, updates) => {
        const coursesCopy = cloneCourses(getLatestCourses());
        const topic = coursesCopy.find(t => t.id === topicId);
        if (topic) {
            Object.assign(topic, updates);
            saveCourses(coursesCopy);
        }
    };

    const deleteTopic = (topicId) => {
        const filtered = getLatestCourses().filter(t => t.id !== topicId);
        saveCourses(filtered);
    };

    // --- WORD CRUD --- //
    const addWordToTopic = (topicId, wordData) => {
        const coursesCopy = cloneCourses(getLatestCourses());
        const topic = coursesCopy.find(t => t.id === topicId);
        if (topic) {
            topic.words.push({
                id: createId('cuswd'),
                ...wordData,
                language: wordData.language || topic.lang || 'en' // [LANGUAGE] inherited
            });
            saveCourses(coursesCopy);
        }
    };

    const updateWordInTopic = (topicId, wordId, updates) => {
        const coursesCopy = cloneCourses(getLatestCourses());
        const topic = coursesCopy.find(t => t.id === topicId);
        if (topic) {
            const w = topic.words.find(x => x.id === wordId);
            if (w) {
                Object.assign(w, updates);
                saveCourses(coursesCopy);
            }
        }
    };

    const deleteWordFromTopic = (topicId, wordId) => {
        const coursesCopy = cloneCourses(getLatestCourses());
        const topic = coursesCopy.find(t => t.id === topicId);
        if (topic) {
            topic.words = topic.words.filter(w => w.id !== wordId);
            saveCourses(coursesCopy);
        }
    };

    const addManyWordsToTopic = (topicId, wordArray) => {
        const coursesCopy = cloneCourses(getLatestCourses());
        const topic = coursesCopy.find(t => t.id === topicId);
        if (topic) {
            wordArray.forEach(wd => {
                topic.words.push({
                    id: createId('cuswd'),
                    ...wd,
                    language: wd.language || topic.lang || 'en'
                });
            });
            saveCourses(coursesCopy);
        }
    };

    return {
        customCourses,
        createTopic,
        updateTopic,
        deleteTopic,
        addWordToTopic,
        updateWordInTopic,
        deleteWordFromTopic,
        addManyWordsToTopic,
        refresh: loadCourses
    };
}
