import React from 'react';

const Butterfly = ({ className }) => {
    return (
        <svg className={`butterfly ${className}`} viewBox="0 0 50 50">
            <path className="wing left" d="M25 25 Q10 5 5 25 Q10 45 25 25" />
            <path className="wing right" d="M25 25 Q40 5 45 25 Q40 45 25 25" />
            <path className="body" d="M24 20 L26 20 L26 30 L24 30 Z" fill="#1a1a1a" />
        </svg>
    );
};

export default Butterfly;
