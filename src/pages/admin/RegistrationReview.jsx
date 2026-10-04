import { useEffect, useState } from "react";
import {
  getRegistrations,
  approveRegistration,
  rejectRegistration,
} from "../../services/registrationService";

const CAMPUS_LABELS = {
  HA_NOI: "Hà Nội",
  HO_CHI_MINH: "TP. Hồ Chí Minh",
  DA_NANG: "Đà Nẵng",
  CAN_THO: "Cần Thơ",
  QUY_NHON: "Quy Nhơn",
};

const FILTERS = [
  { label: "Chờ duyệt", value: "PENDING_APPROVAL" },
  { label: "Đã từ chối", value: "REJECTED" },
  { label: "Đã duyệt", value: "ACTIVE" },
];

const formatDate = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "—");

// Admin xác nhận sinh viên đăng ký bằng email cá nhân (đối chiếu MSSV, họ tên, campus) rồi Duyệt / Từ chối
export default function RegistrationReview({ onChanged }) {
  const [status, setStatus] = useState("PENDING_APPROVAL");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    getRegistrations({ status, size: 100, sort: "createdAt,desc" })
      .then((page) => {
        if (cancelled) return;
        setItems(page.content || []);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Không tải được danh sách đăng ký.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, reloadKey]);

  const reload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const changeStatus = (value) => {
    if (value === status) return;
    setLoading(true);
    setStatus(value);
  };

  const approve = async (item) => {
    setBusyId(item.id);
    try {
      await approveRegistration(item.id);
      reload();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || "Duyệt thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setBusyId(rejecting.id);
    try {
      await rejectRegistration(rejecting.id, reason.trim());
      setRejecting(null);
      setReason("");
      reload();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || "Từ chối thất bại.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border border-[#E8E2D9] rounded-2xl gap-4">
        <div>
          <h2 className="text-xl font-black text-[#2C2825]">Duyệt đăng ký sinh viên</h2>
          <p className="text-xs text-[#6B635B]">
            Sinh viên không có email trường đăng ký bằng email cá nhân. Đối chiếu MSSV, họ tên và campus trước khi duyệt.
          </p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => changeStatus(f.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                status === f.value ? "bg-[#E65100] text-white shadow-md" : "bg-[#F8F6F0] text-[#6B635B] hover:bg-[#F0EBE1]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">{error}</div>
      )}

      <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#FBF9F5] text-[#6B635B] uppercase text-[10px] font-black">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">MSSV</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Campus</th>
              <th className="px-4 py-3">Ngày đăng ký</th>
              {status === "REJECTED" && <th className="px-4 py-3">Lý do từ chối</th>}
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE1] text-[#2C2825]">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#9E958C]">Đang tải...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#9E958C]">Không có đăng ký nào.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-bold">{item.fullName}</td>
                  <td className="px-4 py-3 font-mono">{item.studentCode}</td>
                  <td className="px-4 py-3">{item.email}</td>
                  <td className="px-4 py-3">{CAMPUS_LABELS[item.campus] || item.campus || "—"}</td>
                  <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
                  {status === "REJECTED" && <td className="px-4 py-3 text-[#6B635B]">{item.rejectionReason}</td>}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {status !== "ACTIVE" && (
                        <button
                          onClick={() => approve(item)}
                          disabled={busyId === item.id}
                          className="px-3 py-1.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                        >
                          Duyệt
                        </button>
                      )}
                      {status === "PENDING_APPROVAL" && (
                        <button
                          onClick={() => {
                            setRejecting(item);
                            setReason("");
                          }}
                          disabled={busyId === item.id}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                        >
                          Từ chối
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitReject} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-black text-[#2C2825]">Từ chối đăng ký</h3>
              <p className="text-xs text-[#6B635B]">
                {rejecting.fullName} – {rejecting.studentCode}. Sinh viên sẽ thấy lý do khi đăng nhập và có thể đăng ký lại.
              </p>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              required
              placeholder="VD: MSSV không có trong danh sách sinh viên đủ điều kiện"
              className="w-full rounded-xl border border-[#E8E2D9] bg-[#FBF9F5] px-4 py-2.5 text-xs outline-none focus:border-[#E65100] focus:bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B635B] hover:bg-[#F8F6F0] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || busyId === rejecting.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                Từ chối
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
