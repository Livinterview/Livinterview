// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomTabBar from "../components/BottomTabBar";
import { User, Star, LogOut } from "lucide-react";

interface MeResponse {
  email: string;
  name: string;
  provider?: string;
}

export default function ProfilePage() {
  const backend = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [me, setMe] = useState<MeResponse | null>(null);

  /* ---------- 내 정보 로드 ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backend}/me`, { credentials: "include" });
        if (!res.ok) throw new Error("Not logged in");
        const data: MeResponse = await res.json();
        sessionStorage.setItem("user", JSON.stringify(data));
        setMe(data);
      } catch {
        sessionStorage.removeItem("user");
        navigate("/profile");
      }
    })();
  }, [backend, navigate]);

  /* ---------- 공통 fetch + 이동 ---------- */
  const postAndGo = async (url: string, redirect: string) => {
    await fetch(`${backend}${url}`, { method: "POST", credentials: "include" });
    sessionStorage.removeItem("user");
    navigate(redirect);
  };

  const handleLogout = () => postAndGo("/logout", "/");
  const handleUnregister = () => postAndGo("/unregister", "/");

  const handleHistory = async () => {
    try {
      const res = await fetch(`${backend}/api/histories`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const histories = await res.json();
      navigate("/history", { state: { histories } });
    } catch {
      alert("히스토리 데이터를 불러오는 중 오류가 발생했습니다.");
    }
  };

  /* ---------- 렌더 ---------- */
  return (
    <div className="flex flex-col h-screen bg-white">
      <main className="flex-1 flex flex-col items-center px-6 pt-48 pb-24">
        {/* 프로필 아바타 */}
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
          <User className="w-10 h-10" />
        </div>

        {/* 이름 / 이메일 */}
        <p className="mt-4 text-gray-800 font-medium text-lg">{me?.name}</p>
        <p className="text-sm text-gray-500">{me?.email}</p>

        {/* 로그인 플랫폼 뱃지 */}
        {me?.provider && (
          <p className="text-xs text-gray-400 mt-1">
            로그인 플랫폼: {me.provider.toUpperCase()}
          </p>
        )}

        {/* 메뉴 목록 */}
        <div className="mt-10 w-full space-y-4">
          <MenuItem icon={<Star />} label="History" onClick={handleHistory} />
          <MenuItem icon={<LogOut />} label="Logout" onClick={handleLogout} />
          <MenuItem
            icon={<LogOut />}
            label="Unregister"
            onClick={handleUnregister}
          />
        </div>
      </main>

      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}

/* ------- 작은 재사용 컴포넌트 ------- */
function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between border-t pt-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 text-gray-700">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-gray-400">›</span>
    </div>
  );
}
