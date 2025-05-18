import { useNavigate } from "react-router-dom";

export default function RoomieHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
      <button onClick={() => navigate(-1)} className="text-2xl text-gray-600">
        &#x2039; 
      </button>
      <img
        src="/icons/main.png"
        alt="Roomie"
        className="w-10 h-10 rounded-lg object-cover"
      />
      <span className="text-lg font-semibold">Roomie</span>
    </div>
  );
}

