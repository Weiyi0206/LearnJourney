import React, { createContext, useState, useContext, useEffect } from "react";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persistent auth simulation
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (role) => {
        // Mock login that bypasses actual Supabase auth for now
        const dummyUser = {
            id: "123",
            name: role === "educator" ? "Dr. Smith" : "John Student",
            role: role, // 'educator' or 'student'
            email: `${role}@example.com`,
        };
        setUser(dummyUser);
        localStorage.setItem("user", JSON.stringify(dummyUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
