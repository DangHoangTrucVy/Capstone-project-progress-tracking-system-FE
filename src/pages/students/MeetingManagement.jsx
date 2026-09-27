import React, { useState } from "react";
import { 
  getMeetingById, 
  startMeeting, 
  endMeeting, 
  getMeetingMinutes, 
  generateMeetingMinutes, 
  signMeetingMinutes 
} from "../../services/meetingService";

export default function MeetingManagement({ meetingId = "sample-meeting-id" }) {
  const [meeting, setMeeting] = useState(null);
  const [minutes, setMinutes] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchMeeting = async () => {
    setLoading(true);
    try {
      const meetingData = await getMeetingById(meetingId);
      setMeeting(meetingData);
      const minutesData = await getMeetingMinutes(meetingId).catch(() => null);
      setMinutes(minutesData);
    } catch (err) {
      alert("Không thể tải thông tin cuộc họp. Vui lòng kiểm tra lại ID cuộc họp.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await startMeeting(meetingId);
      alert("Đã bắt đầu cuộc họp!");
      handleFetchMeeting();
    } catch (err) {
      alert("Không thể bắt đầu cuộc họp.");
    }
  };

  const handleEnd = async () => {
    try {
      await endMeeting(meetingId);
      alert("Đã kết thúc cuộc họp!");
      handleFetchMeeting();
    } catch (err) {
      alert("Không thể kết thúc cuộc họp.");
    }
  };

  const handleGenerate = async () => {
    try {
      await generateMeetingMinutes(meetingId);
      alert("Đã tạo biên bản cuộc họp thành công!");
      handleFetchMeeting();
    } catch (err) {
      alert("Không thể tạo biên bản tự động.");
    }
  };

  const handleSign = async () => {
    try {
      await signMeetingMinutes(meetingId);
      alert("Đã ký xác nhận biên bản cuộc họp thành công!");
      handleFetchMeeting();
    } catch (err) {
      alert("Không thể ký xác nhận biên bản.");
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto font-sans animate-fadeIn text-[#2C2825]">
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-2">
        <span className="px-3 py-1 bg-orange-50 text-[#E65100] text-[11px] font-bold rounded-md">
          Meetings & Minutes · Quản lý cuộc họp & Biên bản
        </span>
        <h1 className="text-xl font-black">Phiên họp tư vấn đồ án trực tuyến / trực tiếp</h1>
        <p className="text-xs text-[#6B635B]">
          Quản lý trạng thái phòng họp, ghi nhận biên bản tự động và chữ ký xác nhận của các bên.
        </p>
      </div>

      {/* Tra cứu cuộc họp */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase text-[#6B635B]">Thông tin phiên họp</h3>
        
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Nhập ID cuộc họp (Meeting UUID)..."
            defaultValue={meetingId}
            className="flex-1 px-4 py-2.5 text-xs bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl outline-none focus:border-[#E65100]"
            id="meetingIdInput"
          />
          <button
            onClick={() => {
              const val = document.getElementById("meetingIdInput").value;
              if (val) handleFetchMeeting();
            }}
            className="px-6 py-2.5 bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
          >
            {loading ? "Đang tải..." : "Tải thông tin"}
          </button>
        </div>

        {meeting && (
          <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#6B635B]">Trạng thái:</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-700 font-black rounded-lg">
                {meeting.status || "SCHEDULED"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#6B635B]">Đường dẫn phòng họp (Meeting URL):</span>
              <a href={meeting.meetingUrl} target="_blank" rel="noreferrer" className="text-[#E65100] font-bold hover:underline">
                {meeting.meetingUrl || "Chưa có link"}
              </a>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleStart} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer">
                ▶ Bắt đầu họp
              </button>
              <button onClick={handleEnd} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl cursor-pointer">
                ⏹ Kết thúc họp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Biên bản cuộc họp */}
      {meeting && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-[#6B635B]">Biên bản cuộc họp (Meeting Minutes)</h3>
            <div className="space-x-2">
              <button onClick={handleGenerate} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-xs cursor-pointer">
                ✨ Tạo biên bản tự động
              </button>
              <button onClick={handleSign} className="px-4 py-2 bg-[#E65100] text-white font-bold rounded-xl text-xs cursor-pointer">
                ✍️ Ký xác nhận biên bản
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#FBF9F5] rounded-2xl border border-[#E8E2D9] text-xs space-y-2">
            <p className="font-bold text-[#2C2825]">Nội dung biên bản:</p>
            <p className="text-[#6B635B] whitespace-pre-wrap">
              {minutes?.content || "Chưa có nội dung biên bản cho cuộc họp này."}
            </p>
            <div className="pt-2 border-t border-[#E8E2D9] text-[11px] text-emerald-700 font-bold">
              Trạng thái ký duyệt: {minutes?.signed ? "Đã ký xác nhận ✓" : "Chưa hoàn tất chữ ký"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}