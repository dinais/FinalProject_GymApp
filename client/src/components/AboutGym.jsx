import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/about-gym.css';


function AboutGym() {
    const navigate = useNavigate();
    const speechRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef(null);

    const handleSpeakToggle = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const text = speechRef.current?.innerText;
            if (!text) return;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            utteranceRef.current = utterance;

            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return (
        <div className="about-page">
            <div className="container">
                <div className="about-header">
                    <h1>About Us</h1>
                    <p className="about-subtitle">The Leading Gym Experience</p>
                </div>

                <div className="about-content">
                    <div className="about-section">
                        <div className="about-text" ref={speechRef}>
                            <h2>Our Story</h2>
                            <p>
                                Founded in 2015, our gym was created with a vision to inspire healthier lifestyles.
                                We believe fitness should be accessible, enjoyable, and empowering for everyone.
                            </p>
                            <p>
                                Over the years, we've helped thousands transform their lives through our unique blend of expert training,
                                supportive community, and top-tier equipment.
                            </p>
                            <button
                                className={`cta-button speak-toggle ${isSpeaking ? 'speaking' : ''}`}
                                onClick={handleSpeakToggle}
                                style={{ marginTop: '10px' }}
                            >
                                {isSpeaking ? '🔇 Stop Reading' : '🔊 Read Text'}
                            </button>
                        </div>
                        <div className="about-image">
                            {/* <img src={gymImage} alt="Gym Team" className="image-placeholder" /> */}
                        </div>
                    </div>

                    <div className="mission-section">
                        <h2>Our Mission</h2>
                        <div className="mission-grid">
                            <div className="mission-item">
                                <h3>💪 Excellence</h3>
                                <p>Deliver the highest standard of fitness training</p>
                            </div>
                            <div className="mission-item">
                                <h3>🤗 Inclusivity</h3>
                                <p>Welcome members of all ages and fitness levels</p>
                            </div>
                            <div className="mission-item">
                                <h3>🔥 Motivation</h3>
                                <p>Help every member achieve their goals</p>
                            </div>
                            <div className="mission-item">
                                <h3>🛡️ Safety</h3>
                                <p>Maintain a safe, clean, and supportive environment</p>
                            </div>
                        </div>
                    </div>

                    <div className="team-section">
                        <h2>Our Team</h2>
                        <p>
                            Our team includes certified trainers and wellness experts with years of experience.
                            We continuously train our staff on the latest fitness trends and techniques.
                        </p>
                        <div className="team-stats">
                            <div className="team-stat">
                                <span className="stat-number">+30</span>
                                <span className="stat-label">Certified Trainers</span>
                            </div>
                            <div className="team-stat">
                                <span className="stat-number">+8</span>
                                <span className="stat-label">Years of Experience</span>
                            </div>
                            <div className="team-stat">
                                <span className="stat-number">+4000</span>
                                <span className="stat-label">Happy Members</span>
                            </div>
                            <div className="team-stat">
                                <span className="stat-number">4</span>
                                <span className="stat-label">Active Locations</span>
                            </div>
                        </div>
                    </div>

                    <div className="values-section">
                        <h2>Our Values</h2>
                        <ul className="values-list">
                            <li>Professionalism and passion</li>
                            <li>Individual attention and support</li>
                            <li>A safe and motivating space</li>
                            <li>Honesty and transparency</li>
                            <li>Continuous growth and innovation</li>
                            <li>Teamwork and collaboration</li>
                        </ul>
                    </div>

                    <div className="cta-section">
                        <h2>Ready to Begin?</h2>
                        <p>
                            Join our fitness family and discover the power of movement and transformation.
                            We’re here to support you every step of the way.
                        </p>

                    </div>
                </div>
            </div>
        </div >
    );
}

export default AboutGym;