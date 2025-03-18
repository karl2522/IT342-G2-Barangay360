import { Link } from "react-router-dom"

function LandingPage() {
    return (
        <div className="h-screen w-screen overflow-hidden bg-white flex flex-col">
            {/* Navbar */}
            <nav className="w-full px-12 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex justify-center items-center">
                        <h1 className="text-3xl font-bold text-black">Barangay360</h1>
                    </div>

                    <div className="flex items-center space-x-12">
                        <a href="#announcements" className="text-black hover:text-[#9A031E] text-base">
                            Announcements
                        </a>
                        <a href="#projects" className="text-black hover:text-[#9A031E] text-base">
                            Projects
                        </a>
                        <a href="#events" className="text-black hover:text-[#9A031E] text-base">
                            Events
                        </a>
                    </div>

                    <div className="flex items-center space-x-6">
                        <Link
                            to="/login"
                            className="px-6 py-2 text-base border-2 border-[#9A031E] text-black rounded-xl box-border hover:bg-[#9A031E] hover:text-white transition-all duration-300 ease-in-out"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="px-6 py-2 text-base border-2 border-[#9A031E] bg-[#9A031E] text-white rounded-xl box-border hover:bg-[#83061C] hover:text-white transition-all duration-300 ease-in-out"
                        >
                            Sign Up
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-5xl font-bold text-black mb-8">Bringing Your Barangay Closer to You</h2>
                <p className="text-xl text-center max-w-3xl mb-8 text-gray-600">
                    A community-centric platform designed to strengthen communication and engagement 
                    between barangay officials and residents.
                </p>
                <div className="flex space-x-6">
                    <Link
                        to="/signup"
                        className="px-8 py-3 text-lg border-2 border-[#9A031E] bg-[#9A031E] text-white rounded-xl box-border hover:bg-[#83061C] hover:text-white transition-all duration-300 ease-in-out"
                    >
                        Get Started
                    </Link>
                    <a
                        href="#learn-more"
                        className="px-8 py-3 text-lg border-2 border-[#9A031E] text-black rounded-xl box-border hover:bg-[#9A031E] hover:text-white transition-all duration-300 ease-in-out"
                    >
                        Learn More
                    </a>
                </div>
            </div>
        </div>
    )
}

export default LandingPage