import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
    Users,
    Calendar,
    FileText,
    Bell,
    MessageSquare,
    MapPin,
    ChevronRight,
    Menu,
    X,
    Phone,
    Mail,
    Facebook,
    Twitter,
    Instagram,
} from "lucide-react"

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [showScrollTop, setShowScrollTop] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }

            // Show scroll-to-top button when user scrolls down 300px
            if (window.scrollY > 300) {
                setShowScrollTop(true)
            } else {
                setShowScrollTop(false)
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToSection = (e, sectionId) => {
        e.preventDefault()
        const section = document.getElementById(sectionId)
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 80, // Offset for the fixed header
                behavior: "smooth",
            })
            setIsMenuOpen(false) // Close mobile menu if open
        }
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    return (
        <div className="min-h-screen font-sans text-gray-800">
            {/* Header */}
            <header
                className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-md py-4" : "bg-transparent py-6"}`}
            >
                <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
                    <div className="flex items-center">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 40 40"
                            className="mr-2"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="20" cy="20" r="20" fill="#861A2D" />
                            <path
                                d="M13 14H21C22.0609 14 23.0783 14.4214 23.8284 15.1716C24.5786 15.9217 25 16.9391 25 18C25 19.0609 24.5786 20.0783 23.8284 20.8284C23.0783 21.5786 22.0609 22 21 22H13V14Z"
                                fill="white"
                            />
                            <path
                                d="M13 22H23C24.0609 22 25.0783 22.4214 25.8284 23.1716C26.5786 23.9217 27 24.9391 27 26C27 27.0609 26.5786 28.0783 25.8284 28.8284C25.0783 29.5786 24.0609 30 23 30H13V22Z"
                                fill="white"
                            />
                            <path d="M17 18H21" stroke="#861A2D" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M17 26H23" stroke="#861A2D" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span className="text-xl font-bold text-[#861A2D]">Barangay360</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        <a
                            href="#features"
                            className="text-gray-700 hover:text-[#861A2D] font-medium"
                            onClick={(e) => scrollToSection(e, "features")}
                        >
                            Features
                        </a>
                        <a
                            href="#community"
                            className="text-gray-700 hover:text-[#861A2D] font-medium"
                            onClick={(e) => scrollToSection(e, "community")}
                        >
                            Community
                        </a>
                        <a
                            href="#events"
                            className="text-gray-700 hover:text-[#861A2D] font-medium"
                            onClick={(e) => scrollToSection(e, "events")}
                        >
                            Events
                        </a>
                        <a
                            href="#download"
                            className="text-gray-700 hover:text-[#861A2D] font-medium"
                            onClick={(e) => scrollToSection(e, "download")}
                        >
                            Download
                        </a>
                    </nav>

                    <Link to={"/login"} className="hidden md:block bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-2 px-6 rounded-full transition-colors">
                        Sign in
                    </Link>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden text-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white shadow-lg absolute top-full left-0 right-0 p-4">
                        <nav className="flex flex-col space-y-4">
                            <a
                                href="#features"
                                className="text-gray-700 hover:text-[#861A2D] font-medium"
                                onClick={(e) => scrollToSection(e, "features")}
                            >
                                Features
                            </a>
                            <a
                                href="#community"
                                className="text-gray-700 hover:text-[#861A2D] font-medium"
                                onClick={(e) => scrollToSection(e, "community")}
                            >
                                Community
                            </a>
                            <a
                                href="#events"
                                className="text-gray-700 hover:text-[#861A2D] font-medium"
                                onClick={(e) => scrollToSection(e, "events")}
                            >
                                Events
                            </a>
                            <a
                                href="#download"
                                className="text-gray-700 hover:text-[#861A2D] font-medium"
                                onClick={(e) => scrollToSection(e, "download")}
                            >
                                Download
                            </a>
                            <Link to={"/signin"} className="bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-2 px-6 rounded-full transition-colors w-full">
                                Sign in
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="pt-24 md:pt-32 pb-16 md:pb-24 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                                Your Barangay At Your Fingertips
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
                                Connect with your community, access services, and stay informed about local events and announcements
                                through our comprehensive Barangay management platform.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-3 px-8 rounded-full transition-colors">
                                    Get Started
                                </button>
                                <button className="border border-[#861A2D] text-[#861A2D] hover:bg-[#861A2D] hover:text-white font-medium py-3 px-8 rounded-full transition-colors flex items-center justify-center">
                                    Learn More <ChevronRight size={16} className="ml-1" />
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="relative">
                                {/* Phone frame */}
                                <div className="w-64 h-[500px] bg-gray-900 rounded-[40px] p-3 shadow-xl relative z-10">
                                    {/* Screen */}
                                    <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                                        {/* App mockup */}
                                        <div className="w-full h-16 bg-[#861A2D] flex items-center justify-center">
                                            <span className="text-white font-semibold">Barangay360</span>
                                        </div>
                                        <div className="p-4">
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold mb-2">Upcoming Events</h3>
                                                <div className="bg-gray-100 p-3 rounded-lg mb-2">
                                                    <div className="text-xs">Community Clean-up</div>
                                                    <div className="text-xs text-gray-500">May 15, 2023</div>
                                                </div>
                                                <div className="bg-gray-100 p-3 rounded-lg">
                                                    <div className="text-xs">Town Hall Meeting</div>
                                                    <div className="text-xs text-gray-500">May 20, 2023</div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold mb-2">Services</h3>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-gray-100 p-2 rounded-lg flex flex-col items-center">
                                                        <FileText size={16} className="text-[#861A2D]" />
                                                        <span className="text-[10px] mt-1">Documents</span>
                                                    </div>
                                                    <div className="bg-gray-100 p-2 rounded-lg flex flex-col items-center">
                                                        <Bell size={16} className="text-[#861A2D]" />
                                                        <span className="text-[10px] mt-1">Alerts</span>
                                                    </div>
                                                    <div className="bg-gray-100 p-2 rounded-lg flex flex-col items-center">
                                                        <MessageSquare size={16} className="text-[#861A2D]" />
                                                        <span className="text-[10px] mt-1">Chat</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Home button */}
                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-[#861A2D] opacity-10 rounded-full"></div>
                                <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#861A2D] opacity-10 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Empowering Communities</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Barangay360 provides a comprehensive suite of tools designed to strengthen community bonds and streamline
                            local governance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-[#861A2D]/10 rounded-full flex items-center justify-center mb-4">
                                <Users size={24} className="text-[#861A2D]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Community Engagement</h3>
                            <p className="text-gray-600">
                                Connect with neighbors, participate in discussions, and build stronger community relationships.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-[#861A2D]/10 rounded-full flex items-center justify-center mb-4">
                                <Calendar size={24} className="text-[#861A2D]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Event Management</h3>
                            <p className="text-gray-600">
                                Stay updated on local events, meetings, and celebrations happening in your barangay.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-[#861A2D]/10 rounded-full flex items-center justify-center mb-4">
                                <FileText size={24} className="text-[#861A2D]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Document Processing</h3>
                            <p className="text-gray-600">
                                Request certificates, permits, and other official documents directly through the platform.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-[#861A2D]/10 rounded-full flex items-center justify-center mb-4">
                                <Bell size={24} className="text-[#861A2D]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Emergency Alerts</h3>
                            <p className="text-gray-600">
                                Receive real-time notifications about emergencies, weather alerts, and important announcements.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-[#861A2D]/10 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare size={24} className="text-[#861A2D]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Direct Communication</h3>
                            <p className="text-gray-600">
                                Easily reach out to barangay officials and service providers for assistance and inquiries.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-[#861A2D]/10 rounded-full flex items-center justify-center mb-4">
                                <MapPin size={24} className="text-[#861A2D]" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Local Services Map</h3>
                            <p className="text-gray-600">
                                Discover nearby services, businesses, and important locations within your community.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Community Section */}
            <section id="community" className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Building Stronger Communities Together</h2>
                            <p className="text-gray-600 mb-6">
                                Barangay360 is more than just an app—it's a platform that brings people together, fostering a sense of
                                belonging and shared responsibility.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-10 h-10 bg-[#861A2D]/10 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <Users size={20} className="text-[#861A2D]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Inclusive Participation</h3>
                                        <p className="text-gray-600">
                                            Everyone in the community has a voice and can contribute to local initiatives.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-10 h-10 bg-[#861A2D]/10 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <Calendar size={20} className="text-[#861A2D]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Coordinated Activities</h3>
                                        <p className="text-gray-600">
                                            Organize and participate in community events, volunteer work, and social gatherings.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-10 h-10 bg-[#861A2D]/10 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                                        <MessageSquare size={20} className="text-[#861A2D]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1">Open Communication</h3>
                                        <p className="text-gray-600">
                                            Direct channels to barangay officials ensure your concerns are heard and addressed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="md:w-1/2 grid grid-cols-2 gap-4">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1536337005238-94b997371b40?auto=format&fit=crop&q=80"
                                    alt="Community meeting"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mt-8">
                                <img
                                    src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80"
                                    alt="Community service"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1560252829-804f1aedf1be?auto=format&fit=crop&q=80"
                                    alt="Local celebration"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mt-8">
                                <img
                                    src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80"
                                    alt="Community project"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Community Says</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Hear from residents and officials who have experienced the positive impact of Barangay360.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Testimonial 1 */}
                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-[#861A2D] rounded-full flex items-center justify-center text-white font-bold mr-4">
                                    M
                                </div>
                                <div>
                                    <h4 className="font-semibold">Maria Santos</h4>
                                    <p className="text-sm text-gray-500">Resident</p>
                                </div>
                            </div>
                            <p className="text-gray-600 italic">
                                "Barangay360 has made it so much easier to stay connected with what's happening in our community. I love
                                getting updates about local events and being able to request documents without having to visit the
                                barangay hall."
                            </p>
                            <div className="flex mt-4">
                                <div className="text-yellow-400">★★★★★</div>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-[#861A2D] rounded-full flex items-center justify-center text-white font-bold mr-4">
                                    J
                                </div>
                                <div>
                                    <h4 className="font-semibold">Juan Reyes</h4>
                                    <p className="text-sm text-gray-500">Barangay Captain</p>
                                </div>
                            </div>
                            <p className="text-gray-600 italic">
                                "As a barangay official, this platform has revolutionized how we communicate with our constituents. We
                                can now reach everyone quickly during emergencies and streamline our administrative processes."
                            </p>
                            <div className="flex mt-4">
                                <div className="text-yellow-400">★★★★★</div>
                            </div>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-[#861A2D] rounded-full flex items-center justify-center text-white font-bold mr-4">
                                    A
                                </div>
                                <div>
                                    <h4 className="font-semibold">Ana Lim</h4>
                                    <p className="text-sm text-gray-500">Small Business Owner</p>
                                </div>
                            </div>
                            <p className="text-gray-600 italic">
                                "The local services map feature has helped my small business gain visibility in the community. More
                                neighbors now know about my store, and I've seen a significant increase in local customers."
                            </p>
                            <div className="flex mt-4">
                                <div className="text-yellow-400">★★★★☆</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Events Section */}
            <section id="events" className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Community Events</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Stay informed about the latest happenings in your barangay and never miss an important event.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Event 1 */}
                        <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-[#861A2D]/10 relative">
                                <div className="absolute top-4 left-4 bg-[#861A2D] text-white text-sm font-medium py-1 px-3 rounded-full">
                                    May 15
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&q=80"
                                    alt="Community clean-up"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">Community Clean-up Drive</h3>
                                <p className="text-gray-600 mb-4">
                                    Join us in keeping our barangay clean and green. Bring your family and friends!
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar size={16} className="mr-2" />
                                    <span>8:00 AM - 12:00 PM</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <MapPin size={16} className="mr-2" />
                                    <span>Barangay Plaza</span>
                                </div>
                                <button className="mt-4 w-full bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-2 rounded-lg transition-colors">
                                    Register to Join
                                </button>
                            </div>
                        </div>

                        {/* Event 2 */}
                        <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-[#861A2D]/10 relative">
                                <div className="absolute top-4 left-4 bg-[#861A2D] text-white text-sm font-medium py-1 px-3 rounded-full">
                                    May 20
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80"
                                    alt="Town hall meeting"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">Town Hall Meeting</h3>
                                <p className="text-gray-600 mb-4">
                                    Discuss important community matters and share your ideas for improvement.
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar size={16} className="mr-2" />
                                    <span>6:00 PM - 8:00 PM</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <MapPin size={16} className="mr-2" />
                                    <span>Barangay Hall</span>
                                </div>
                                <button className="mt-4 w-full bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-2 rounded-lg transition-colors">
                                    Add to Calendar
                                </button>
                            </div>
                        </div>

                        {/* Event 3 */}
                        <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-[#861A2D]/10 relative">
                                <div className="absolute top-4 left-4 bg-[#861A2D] text-white text-sm font-medium py-1 px-3 rounded-full">
                                    June 5
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80"
                                    alt="Health seminar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold mb-2">Free Health Seminar</h3>
                                <p className="text-gray-600 mb-4">
                                    Learn about preventive healthcare and wellness from medical professionals.
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar size={16} className="mr-2" />
                                    <span>9:00 AM - 11:00 AM</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <MapPin size={16} className="mr-2" />
                                    <span>Community Center</span>
                                </div>
                                <button className="mt-4 w-full bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-2 rounded-lg transition-colors">
                                    Register to Join
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-10">
                        <button className="inline-flex items-center bg-white border border-[#861A2D] text-[#861A2D] hover:bg-[#861A2D] hover:text-white font-medium py-2 px-6 rounded-full transition-colors">
                            View All Events <ChevronRight size={16} className="ml-1" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Download App Section */}
            <section id="download" className="py-16 md:py-24 bg-[#861A2D]">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Get Barangay360 on Your Phone</h2>
                            <p className="text-white/80 mb-8 max-w-lg">
                                Download our mobile app to access all Barangay360 features on the go. Stay connected with your community
                                anytime, anywhere.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="bg-black text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 mr-2"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M17.5383 12.0001C17.5383 11.4501 17.4783 10.9251 17.3583 10.4251L12.0033 10.4251L12.0033 12.7501L15.1533 12.7501C15.0033 13.7001 14.4283 14.5001 13.5533 15.0501L13.5533 16.9251L15.9283 16.9251C17.4033 15.5751 17.5383 13.0001 17.5383 12.0001Z" />
                                        <path d="M12.0033 18.0001C14.0033 18.0001 15.7033 17.2501 16.9283 16.0001L14.5533 16.0001C13.7783 16.5001 12.9533 16.7501 12.0033 16.7501C9.87827 16.7501 8.10327 15.2501 7.51327 13.2501L5.10327 13.2501L5.10327 15.1251C6.30327 16.9001 8.47827 18.0001 12.0033 18.0001Z" />
                                        <path d="M7.51327 13.2501C7.28327 12.7501 7.15327 12.2001 7.15327 11.6251C7.15327 11.0501 7.28327 10.5001 7.51327 10.0001L7.51327 8.12506L5.10327 8.12506C4.43327 9.17506 4.05327 10.3751 4.05327 11.6251C4.05327 12.8751 4.43327 14.0751 5.10327 15.1251L7.51327 13.2501Z" />
                                        <path d="M12.0033 6.50006C13.3283 6.50006 14.5033 6.97506 15.4033 7.82506L17.5033 5.72506C15.9783 4.30006 14.1033 3.50006 12.0033 3.50006C8.47827 3.50006 6.30327 4.60006 5.10327 6.37506L7.51327 8.25006C8.10327 6.25006 9.87827 4.75006 12.0033 4.75006Z" />
                                    </svg>
                                    Google Play
                                </button>
                                <button className="bg-black text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-6 w-6 mr-2"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M14.8533 5.65839C15.5333 4.82839 16.0133 3.66839 15.8533 2.49839C14.8533 2.55839 13.6533 3.15839 12.9533 3.98839C12.3133 4.74839 11.7333 5.91839 11.9333 7.06839C13.0533 7.09839 14.1733 6.48839 14.8533 5.65839Z" />
                                        <path d="M16.2933 7.32839C15.0933 7.32839 14.1333 7.98839 13.4733 7.98839C12.7933 7.98839 11.8933 7.35839 10.8933 7.35839C9.65332 7.35839 8.29332 8.26839 7.53332 9.71839C6.39332 11.9884 7.21332 15.9984 8.31332 18.1184C8.86332 19.1584 9.53332 20.3184 10.4133 20.2884C11.2533 20.2584 11.5933 19.7484 12.6133 19.7484C13.6333 19.7484 13.9433 20.2884 14.8333 20.2684C15.7533 20.2484 16.3333 19.2184 16.8833 18.1784C17.5333 16.9684 17.7933 15.7984 17.8133 15.7384C17.7933 15.7284 16.0533 15.0384 16.0333 12.8484C16.0133 11.0684 17.3933 10.2584 17.4733 10.2084C16.6333 8.93839 15.2733 8.82839 14.8133 8.79839C13.6533 8.72839 12.6733 9.54839 12.0533 9.54839C11.4533 9.54839 10.6133 8.82839 9.59332 8.82839C9.59332 8.82839 9.59332 8.82839 9.59332 8.82839C9.59332 8.82839 9.59332 8.82839 9.59332 8.82839C9.59332 8.82839 9.59332 8.82839 9.59332 8.82839Z" />
                                    </svg>
                                    App Store
                                </button>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            <div className="relative">
                                {/* Phone mockup */}
                                <div className="w-64 h-[500px] bg-gray-900 rounded-[40px] p-3 shadow-xl relative z-10">
                                    {/* Screen */}
                                    <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
                                        {/* App mockup */}
                                        <div className="w-full h-16 bg-[#861A2D] flex items-center justify-center">
                                            <span className="text-white font-semibold">Barangay360</span>
                                        </div>
                                        <div className="p-4">
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold mb-2">Community Feed</h3>
                                                <div className="bg-gray-100 p-3 rounded-lg mb-2">
                                                    <div className="flex items-center mb-2">
                                                        <div className="w-8 h-8 bg-[#861A2D] rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                                            B
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold">Barangay Office</div>
                                                            <div className="text-[10px] text-gray-500">2 hours ago</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs">
                                                        Water service interruption scheduled for tomorrow, 6AM-12PM. Please store water accordingly.
                                                    </div>
                                                </div>
                                                <div className="bg-gray-100 p-3 rounded-lg">
                                                    <div className="flex items-center mb-2">
                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold mr-2">
                                                            J
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold">Juan Dela Cruz</div>
                                                            <div className="text-[10px] text-gray-500">5 hours ago</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs">
                                                        Looking for volunteers for the weekend clean-up drive. Please sign up at the barangay hall.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Home button */}
                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-white opacity-10 rounded-full"></div>
                                <div className="absolute -top-6 -left-6 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="bg-gray-50 rounded-2xl p-8 md:p-12 shadow-lg">
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="md:w-2/3 mb-8 md:mb-0 md:pr-10">
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Connect with Your Community?</h2>
                                <p className="text-gray-600 mb-6">
                                    Join thousands of residents already using Barangay360 to stay connected, informed, and engaged with
                                    their local community.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button className="bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-3 px-8 rounded-full transition-colors">
                                        Sign Up Now
                                    </button>
                                    <button className="border border-[#861A2D] text-[#861A2D] hover:bg-[#861A2D] hover:text-white font-medium py-3 px-8 rounded-full transition-colors flex items-center justify-center">
                                        Request a Demo <ChevronRight size={16} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                            <div className="md:w-1/3">
                                <div className="bg-white p-6 rounded-xl shadow-md">
                                    <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
                                    <form className="space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                                Message
                                            </label>
                                            <textarea
                                                id="message"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#861A2D] focus:border-transparent"
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-[#861A2D] hover:bg-[#6d1525] text-white font-medium py-2 rounded-md transition-colors"
                                        >
                                            Send Message
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <svg
                                    width="40"
                                    height="40"
                                    viewBox="0 0 40 40"
                                    className="mr-2"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle cx="20" cy="20" r="20" fill="#861A2D" />
                                    <path
                                        d="M13 14H21C22.0609 14 23.0783 14.4214 23.8284 15.1716C24.5786 15.9217 25 16.9391 25 18C25 19.0609 24.5786 20.0783 23.8284 20.8284C23.0783 21.5786 22.0609 22 21 22H13V14Z"
                                        fill="white"
                                    />
                                    <path
                                        d="M13 22H23C24.0609 22 25.0783 22.4214 25.8284 23.1716C26.5786 23.9217 27 24.9391 27 26C27 27.0609 26.5786 28.0783 25.8284 28.8284C25.0783 29.5786 24.0609 30 23 30H13V22Z"
                                        fill="white"
                                    />
                                    <path d="M17 18H21" stroke="#861A2D" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M17 26H23" stroke="#861A2D" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="text-xl font-bold">Barangay360</span>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Connecting communities, streamlining governance, and empowering citizens through technology.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <Facebook size={20} />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <Twitter size={20} />
                                </a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                    <Instagram size={20} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        Home
                                    </a>
                                </li>
                                <li>
                                    <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="#community" className="text-gray-400 hover:text-white transition-colors">
                                        Community
                                    </a>
                                </li>
                                <li>
                                    <a href="#events" className="text-gray-400 hover:text-white transition-colors">
                                        Events
                                    </a>
                                </li>
                                <li>
                                    <a href="#download" className="text-gray-400 hover:text-white transition-colors">
                                        Download
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Resources</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        Help Center
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        Community Guidelines
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        Terms of Service
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                        FAQ
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center">
                                    <Phone size={16} className="mr-2 text-gray-400" />
                                    <span className="text-gray-400">+63 (2) 8123 4567</span>
                                </li>
                                <li className="flex items-center">
                                    <Mail size={16} className="mr-2 text-gray-400" />
                                    <span className="text-gray-400">info@barangay360.com</span>
                                </li>
                                <li className="flex items-start">
                                    <MapPin size={16} className="mr-2 mt-1 text-gray-400" />
                                    <span className="text-gray-400">123 Main Street, Makati City, Metro Manila, Philippines</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-400 text-sm mb-4 md:mb-0">
                            &copy; {new Date().getFullYear()} Barangay360. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                Terms of Service
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
            {/* Scroll to top button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 bg-[#861A2D] hover:bg-[#6d1525] text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
                    aria-label="Scroll to top"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-chevron-up"
                    >
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </button>
            )}
        </div>
    )
}
