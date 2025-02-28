import { Link } from "react-router-dom"
import { facebook } from "../assets"

function LandingPage() {
    return (
        <div className="h-screen w-screen overflow-hidden bg-white flex flex-col">
            {/* Navbar */}
            <nav className="w-full px-12 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex justify-center items-center">
                        <img 
                            src={facebook}
                            alt="logo" 
                            className="h-20 w-auto"
                        />
                        <h1 className="text-3xl font-bold text-black pl-5">Barangay360</h1>
                    </div>

                    <div className="flex items-center space-x-12">
                        <Link href="#announcements" className="text-black hover:text-[#9A031E] text-base">
                            Announcements
                        </Link>
                        <Link href="#projects" className="text-black hover:text-[#9A031E] text-base">
                            Projects
                        </Link>
                        <Link href="#events" className="text-black hover:text-[#9A031E] text-base">
                            Events
                        </Link>
                    </div>

                    <div className="felx items-center space-x-6">
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

            <div className="flex flex-col items-center justify-center">
                <h2 className="text-5xl font-bold text-black">Bringing Your Barangay Closer to You</h2>
            </div>


            
        </div>
    )
}

export default LandingPage