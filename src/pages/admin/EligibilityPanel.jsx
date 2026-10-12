import { useEffect, useState } from "react";
import {
  importEligibilityJson,
  importEligibilityFile,
  getImportedStudents,
  updateStudentEligibility,
} from "../../services/eligibilityService";
import { apiError } from "../../utils/apiError";

const example = JSON.stringify(
  {
    students: [
      {
        email: "se170001@fpt.edu.vn",
        fullName: "Nguyễn Văn A",
        studentCode: "SE170001",
        eligible: false,
        reason: "Nợ học phí",
      },
    ],
  },
  null,
  2,
);
const input = "rounded-xl border border-[#E8E2D9] p-3 text-sm bg-white";

function StudentTable({ students }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {[
              "MSSV",
              "Họ tên",
              "Email",
              "Điều kiện",
              "Lý do",
              "Kết quả / Ngày import",
            ].map((label) => (
              <th key={label} className="p-3">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.userId || s.id || s.email} className="border-t">
              <td className="p-3">{s.studentCode || "—"}</td>
              <td className="p-3">{s.fullName}</td>
              <td className="p-3">{s.email}</td>
              <td className="p-3">
                {s.eligible ? "Đủ điều kiện" : "Chưa đủ điều kiện"}
              </td>
              <td className="p-3">
                {s.ineligibleReason || s.reason || s.eligibilityReason || "—"}
              </td>
              <td className="p-3">
                {s.action ||
                  (s.importedAt
                    ? new Date(s.importedAt).toLocaleString("vi-VN")
                    : "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!students.length && <p className="p-3">Không có sinh viên.</p>}
    </div>
  );
}

export default function EligibilityPanel({ onChanged }) {
  const [json, setJson] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [eligible, setEligible] = useState("");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [userId, setUserId] = useState("");
  const [flag, setFlag] = useState("true");
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    getImportedStudents({
      page,
      size: 20,
      q: q || undefined,
      eligible: eligible === "" ? undefined : eligible === "true",
    })
      .then((data) => {
        if (!cancelled) {
          setItems(data.content || []);
          setTotalPages(data.totalPages || 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(apiError(err));
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, q, eligible, reload]);

  const refresh = () => {
    setLoading(true);
    setReload((n) => n + 1);
    onChanged?.();
  };
  const submit = async (event, kind) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      let response;
      if (kind === "file") {
        if (!file) throw new Error("Vui lòng chọn file.");
        const data = new FormData();
        data.append("file", file);
        response = await importEligibilityFile(data);
      } else {
        let data;
        try {
          data = JSON.parse(json);
        } catch {
          throw new Error("JSON không hợp lệ. Vui lòng kiểm tra cú pháp.");
        }
        response = await importEligibilityJson(
          Array.isArray(data) ? { students: data } : data,
        );
      }
      setResult(response);
      refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  const update = async (event) => {
    event.preventDefault();

    if (busy || !userId.trim()) return;

    if (flag === "false" && !reason.trim()) {
      setError("Vui lòng nhập lý do sinh viên chưa đủ điều kiện.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      await updateStudentEligibility(userId.trim(), {
        eligible: flag === "true",
        reason: reason.trim(),
      });

      setReason("");
      refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="p-8 space-y-6 text-[#2C2825]">
      <h1 className="text-xl font-bold">
        Import & danh sách điều kiện sinh viên
      </h1>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => submit(e, "file")}
        className="overflow-hidden rounded-3xl border border-[#E9DED4] bg-white shadow-sm transition hover:shadow-md"
      >
        <div className="border-b border-[#F0E8E1] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F8EAE0] text-[#B96943]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-[#352D28]">
                Import CSV / Excel
              </h2>
              <p className="mt-1 text-sm text-[#81766D]">
                Tải danh sách sinh viên và cập nhật điều kiện hàng loạt.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[".csv", ".xlsx", ".xls"].map((ext) => (
                  <span
                    key={ext}
                    className="rounded-lg border border-[#E9DED4] bg-[#FCFAF7] px-2.5 py-1 text-xs font-semibold text-[#8D6B56]"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <label
            htmlFor="eligibility-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#DFC5B2] bg-[#FCF8F4] px-5 py-8 text-center transition hover:border-[#C9784F] hover:bg-[#FAF0E8]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#B96943] shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2" />
              </svg>
            </span>

            <span className="mt-3 text-sm font-bold text-[#51463F]">
              Chọn file từ máy tính
            </span>
            <span className="mt-1 text-xs text-[#968A80]">
              Chọn file CSV hoặc Excel để bắt đầu import
            </span>

            <input
              id="eligibility-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              required
              disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-4 block w-full max-w-sm cursor-pointer rounded-xl border border-[#E9DED4] bg-white text-sm text-[#81766D] file:mr-3 file:cursor-pointer file:border-0 file:bg-[#F3E4D9] file:px-4 file:py-3 file:font-semibold file:text-[#92583B] hover:file:bg-[#EED8C8] disabled:opacity-50"
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 rounded-xl border border-[#E5D9CE] bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8EAE0] text-xs font-black text-[#A96745]">
                XLS
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#51463F]">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-[#968A80]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  const inputElement =
                    document.getElementById("eligibility-file");
                  if (inputElement) inputElement.value = "";
                }}
                disabled={busy}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-[#A96745] transition hover:bg-[#F8EAE0] disabled:opacity-50"
              >
                Bỏ file
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-[#F0E2D5] bg-[#FCF8F4] p-4">
            <p className="text-sm font-bold text-[#8D5639]">
              Quy định dữ liệu import
            </p>
            <p className="mt-2 text-sm leading-6 text-[#81766D]">
              Các cột gồm email, ho_ten, mssv, du_dieu_kien và ly_do. Chỉ dùng
              MSSV để nhận diện khi sinh viên đã có tài khoản.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#F0E8E1] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#968A80]">
              Vui lòng kiểm tra file trước khi tải lên hệ thống.
            </p>

            <button
              type="submit"
              disabled={busy || !file}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9784F] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B96943] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span>↑</span>
                  Tải lên danh sách
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <form
        onSubmit={(e) => submit(e, "json")}
        className="overflow-hidden rounded-3xl border border-[#E9DED4] bg-white shadow-sm transition hover:shadow-md"
      >
        <div className="border-b border-[#F0E8E1] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F8EAE0] text-[#B96943]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m16 18 6-6-6-6" />
                <path d="m8 6-6 6 6 6" />
                <path d="m14 4-4 16" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-[#352D28]">
                Import JSON
              </h2>
              <p className="mt-1 text-sm text-[#81766D]">
                Nhập dữ liệu sinh viên dưới dạng JSON để cập nhật điều kiện hàng
                loạt.
              </p>
            </div>

            <span className="shrink-0 rounded-lg bg-[#FCF0E7] px-3 py-1.5 text-xs font-bold text-[#A65D39]">
              JSON
            </span>
          </div>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="eligibility-json"
                className="text-sm font-bold text-[#51463F]"
              >
                Nội dung dữ liệu
              </label>

              <button
                type="button"
                onClick={() => setJson(example)}
                disabled={busy}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#A96745] transition hover:bg-[#F8EAE0] disabled:opacity-50"
              >
                Dùng dữ liệu mẫu
              </button>
            </div>

            <textarea
              id="eligibility-json"
              className="min-h-65 w-full resize-y rounded-2xl border border-[#E9DED4] bg-[#FCFAF7] p-4 font-mono text-sm leading-6 text-[#51463F] outline-none transition placeholder:text-[#B3A69B] focus:border-[#C9784F] focus:bg-white focus:ring-4 focus:ring-[#C9784F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              rows={10}
              placeholder={example}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              required
              disabled={busy}
              spellCheck={false}
            />

            <p className="text-xs leading-5 text-[#968A80]">
              Hỗ trợ các trường: <code>email</code>, <code>fullName</code>,{" "}
              <code>studentCode</code>, <code>eligible</code> và{" "}
              <code>reason</code>.
            </p>
          </div>

          <div className="rounded-2xl border border-[#F0E2D5] bg-[#FCF8F4] p-4">
            <p className="text-sm font-bold text-[#8D5639]">Cấu trúc dữ liệu</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap wrap-break-words font-mono text-xs leading-5 text-[#81766D]">
              {`{
  "students": [
    {
      "email": "se170001@fpt.edu.vn",
      "fullName": "Nguyễn Văn A",
      "studentCode": "SE170001",
      "eligible": false,
      "reason": "Nợ học phí"
    }
  ]
}`}
            </pre>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#F0E8E1] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-[#968A80]">
              Kiểm tra cú pháp JSON trước khi gửi dữ liệu.
            </p>

            <button
              type="submit"
              disabled={busy || !json.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9784F] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B96943] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span>↑</span>
                  Import dữ liệu JSON
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {result && (
        <div className="bg-white rounded-2xl border p-6 space-y-3">
          <h2 className="font-bold">Kết quả import</h2>
          <p>
            Tạo: {result.created || 0} · Cập nhật: {result.updated || 0} · Gắn
            cờ: {result.flagged || 0} · Gỡ cờ: {result.cleared || 0}
          </p>
          <StudentTable students={result.students || []} />
          {!!result.invalid?.length && (
            <div role="alert" className="text-red-700">
              <h3>Dòng không hợp lệ</h3>
              <ul>
                {result.invalid.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={update}
        className="overflow-hidden rounded-3xl border border-[#E9DED4] bg-white shadow-sm"
      >
        <div className="border-b border-[#F0E8E1] p-6 sm:p-7">
          <span className="rounded-full bg-[#F8EAE0] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#A96745]">
            Quản lý điều kiện
          </span>

          <h2 className="mt-3 text-xl font-black text-[#352D28]">
            Cập nhật điều kiện sinh viên
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#81766D]">
            Nhập ID sinh viên, chọn trạng thái và ghi rõ lý do để lưu vào danh
            sách.
          </p>
        </div>

        <div className="grid gap-5 p-6 sm:p-7 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[#51463F]">
            Mã số sinh viên
            <input
              aria-label="Mã số sinh viên"
              className="w-full rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 font-normal outline-none transition placeholder:text-[#B6AAA0] focus:border-[#C98C68] focus:ring-2 focus:ring-[#D9A27F]/20"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Mã số sinh viên..."
              required
              disabled={busy}
            />
          </label>

          <label className="space-y-2 text-sm font-semibold text-[#51463F]">
            Trạng thái điều kiện
            <select
              aria-label="Điều kiện mới"
              className="w-full rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 font-normal outline-none transition focus:border-[#C98C68] focus:ring-2 focus:ring-[#D9A27F]/20"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              disabled={busy}
            >
              <option value="true">Đủ điều kiện</option>
              <option value="false">Chưa đủ điều kiện</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-[#51463F] lg:col-span-2">
            Lý do cập nhật
            <textarea
              className="min-h-28 w-full resize-y rounded-xl border border-[#E5D9CE] bg-[#FCFAF7] px-4 py-3.5 font-normal outline-none transition placeholder:text-[#B6AAA0] focus:border-[#C98C68] focus:ring-2 focus:ring-[#D9A27F]/20 disabled:opacity-60"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                flag === "false"
                  ? "Ví dụ: Không đủ điều kiện làm đồ án do còn nợ học phí..."
                  : "Nhập lý do cập nhật (nếu có)..."
              }
              required={flag === "false"}
              disabled={busy}
            />
            <span className="block text-xs font-normal text-[#968A80]">
              Khi chọn “Chưa đủ điều kiện”, Admin bắt buộc nhập lý do.
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#F0E8E1] bg-[#FCFAF7] p-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs text-[#81766D]">
            Thông tin cập nhật sẽ được làm mới trong danh sách sau khi lưu thành
            công.
          </p>

          <button
            type="submit"
            disabled={busy || !userId.trim()}
            className="rounded-xl bg-[#C9784F] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#B96943] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Đang cập nhật..." : "Lưu điều kiện"}
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-2xl border space-y-4">
        <h2 className="font-bold">Sinh viên đã import</h2>
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            setPage(0);
            setQ(query.trim());
            setReload((n) => n + 1);
          }}
        >
          <input
            className={input}
            aria-label="Tìm sinh viên"
            placeholder="Tên, email hoặc MSSV"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className={input}
            aria-label="Lọc điều kiện"
            value={eligible}
            onChange={(e) => {
              setError("");
              setLoading(true);
              setEligible(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả điều kiện</option>
            <option value="true">Đủ điều kiện</option>
            <option value="false">Chưa đủ điều kiện</option>
          </select>
          <button className={input}>Tìm kiếm</button>
        </form>
        {loading ? <p>Đang tải...</p> : <StudentTable students={items} />}
        <div className="flex gap-3 items-center">
          <button
            className={input}
            disabled={loading || page === 0}
            onClick={() => {
              setLoading(true);
              setPage((p) => p - 1);
            }}
          >
            Trước
          </button>
          <span>
            Trang {page + 1} / {Math.max(totalPages, 1)}
          </span>
          <button
            className={input}
            disabled={loading || page + 1 >= totalPages}
            onClick={() => {
              setLoading(true);
              setPage((p) => p + 1);
            }}
          >
            Sau
          </button>
        </div>
      </div>
    </section>
  );
}
