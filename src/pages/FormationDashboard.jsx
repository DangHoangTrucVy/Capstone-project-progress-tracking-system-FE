import { useEffect, useState } from "react";
import { call, allRows } from "../services/formationService";
import NotificationBell from "../components/NotificationBell";
import "./FormationDashboard.css";

const failMessage = error => error.response?.data?.message || error.message;
const asList = value => Array.isArray(value) ? value : value?.content || [];
function Table({ columns, rows }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map(([label]) =>
    <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map((row, index) =>
    <tr key={row.id || row.enrollmentId || index}>{columns.map(([label, render]) =>
      <td key={label}>{render(row)}</td>)}</tr>)}</tbody></table>
    {!rows.length && <p>Không có dữ liệu.</p>}</div>;
}
function Json({ value }) { return value ? <pre>{JSON.stringify(value, null, 2)}</pre> : null; }
function Input({ label, name, type = "text", required = true }) {
  return <label>{label}<input name={name} type={type} required={required} /></label>;
}
async function fetchDashboard(code, account) {
    if (!code || !account) return { data: {} };
    if (account.role === "STUDENT") {
      const mine = await call("mySemesters");
      const currentSubject = mine.find(item => item.semesterCode === code)?.subjects?.[0];
      if (!currentSubject) return { semesters: mine, data: {} };
      const subjectPath = { subjectId: currentSubject.subjectId };
      const [openGroups, requests, leaveRequests, transfers, timing] = await Promise.all([
        call("openGroups", { path: subjectPath }), call("myRequests", { path: subjectPath }),
        call("myLeaveRequests"), call("myTransfers"), call("subject", { path: subjectPath }),
      ]);
      const group = currentSubject.group ? await call("group", { path: { groupId: currentSubject.group.id } }) : null;
      const groupRequests = group && currentSubject.group.leader
        ? await call("groupRequests", { path: { groupId: group.id } }) : [];
      const groupLeaveRequests = group && currentSubject.group.leader
        ? await call("groupLeaveRequests", { path: { groupId: group.id } }) : [];
      return { semesters: mine, data: { openGroups, requests, leaveRequests, transfers, timing, group, groupRequests, groupLeaveRequests } };
    } else {
      const [students, groups, scopes, statistics, subjects] = await Promise.all([
        allRows("students", { semester: code }), allRows("groups", { semester: code }),
        call("scopes", { path: { semester: code } }), call("statistics", { path: { semester: code } }),
        call("subjects", { path: { semester: code } }),
      ]);
      return { data: { students, groups, scopes, statistics, subjects } };
    }
  }

export default function FormationDashboard() {
  const [user, setUser] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [semester, setSemester] = useState("");
  const [tab, setTab] = useState("groups");
  const [data, setData] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [details, setDetails] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");
  const [importConfirmed, setImportConfirmed] = useState(false);
  const student = user?.role === "STUDENT";
  const own = semesters.find(item => item.semesterCode === semester);
  const subject = own?.subjects?.[0];
  const ownGroup = subject?.group;
  const path = { semester };
  async function load(code = semester, account = user) {
    const result = await fetchDashboard(code, account);
    if (result.semesters) setSemesters(result.semesters);
    setData(result.data);
  }
  async function run(work, message = "Đã thực hiện thành công.") {
    setBusy(true); setError(""); setNotice("");
    try { await work(); setNotice(message); }
    catch (e) { setError(failMessage(e)); }
    finally { setBusy(false); }
  }
  async function mutate(name, route, body) {
    const requestBody = name === "updateProfile" ? { ...(await call("profile")), ...body } : body;
    await call(name, { path: route, body: requestBody });
    await load();
  }
  useEffect(() => {
    let cancelled = false;
    async function start() {
      setBusy(true);
      try {
        const account = await call("me");
        const list = await call(account.role === "STUDENT" ? "mySemesters" : "semesters");
        if (cancelled) return;
        setUser(account); setSemesters(list);
        const code = list[0]?.semesterCode || list[0]?.code || "";
        setSemester(code);
        const result = await fetchDashboard(code, account);
        if (!cancelled) setData(result.data);
      } catch (e) { if (!cancelled) setError(failMessage(e)); }
      finally { if (!cancelled) setBusy(false); }
    }
    start();
    return () => { cancelled = true; };
  }, []);
  async function chooseSemester(code) {
    setSemester(code); setDetails(null); setPreview(null); setImportConfirmed(false);
    await run(() => load(code), "Đã tải học kỳ.");
  }
  function submit(event, handler) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    run(() => handler(values));
  }
  const shownStudents = (data.students || []).filter(item =>
    (studentFilter !== "ungrouped" || !item.hasGroup) &&
    (studentFilter !== "ineligible" || item.eligibility === "INELIGIBLE") &&
    [item.fullName, item.email, item.studentCode].some(text => text?.toLowerCase().includes(query.toLowerCase())));
  return <main className="formation">
    <header><div><h1>Website ghép nhóm</h1><p>{user?.fullName} · {user?.role === "LECTURER" ? "Moderator" : user?.role}</p></div>
      <div className="row"><NotificationBell /><button onClick={() => {
        ["accessToken", "user", "role", "groupId"].forEach(key => localStorage.removeItem(key));
        window.location.assign("/login");
      }}>Đăng xuất</button></div></header>
    {error && <p role="alert" className="error">{error}</p>}
    {notice && <p role="status" className="notice">{notice}</p>}
    <div className="row"><label>Học kỳ<select value={semester} disabled={busy} onChange={e => chooseSemester(e.target.value)}>
      {semesters.map(item => <option key={item.code || item.semesterCode} value={item.code || item.semesterCode}>
        {item.code || item.semesterCode} — {item.name || item.semesterName}
      </option>)}</select></label><button disabled={busy} onClick={() => run(() => load(), "Đã tải lại dữ liệu.")}>Làm mới</button>
      {busy && <span role="status">Đang xử lý...</span>}</div>
    {!semesters.length && !busy && <p>Bạn chưa được phân công hoặc chưa có trong danh sách học kỳ.</p>}
    <nav>{(student ? [["groups","Nhóm của tôi"],["requests","Apply / Invite"],["profile","Hồ sơ"]]
      : [["groups","Danh sách nhóm"],["students","Sinh viên"],["scopes","Deadline và chốt"],["import","Import sinh viên"],["export","Thống kê / Excel"],
        ...(user?.role === "ADMIN" ? [["accounts","Moderator"]] : [])]).map(([key,label]) =>
      <button key={key} aria-selected={tab === key} onClick={() => { setTab(key); setDetails(null); }}>{label}</button>)}</nav>
    {!student && tab === "groups" && <section><h2>Danh sách nhóm</h2><Table rows={data.groups || []} columns={[
      ["Mã nhóm", group => group.code], ["Tên", group => group.name], ["Ngành", group => group.majorCode],
      ["Sĩ số", group => group.size + "/5"], ["Khóa", group => group.locked ? "Có" : "Không"],
      ["Chốt", group => group.finalized ? "Có" : "Không"],
      ["Chi tiết", group => <button onClick={() => run(async () => setDetails(await call("group", {path:{groupId:group.id}})), "Đã tải nhóm.")}>Xem</button>],
    ]} /><Json value={details} />
      <h3>Điều phối thành viên</h3><form onSubmit={e => submit(e, values =>
        mutate(values.action, {groupId:values.groupId}, {userId:values.userId,reason:values.reason}))}>
        <label>Nhóm<select name="groupId">{(data.groups || []).map(group => <option key={group.id} value={group.id}>{group.code}</option>)}</select></label>
        <label>Sinh viên<select name="userId">{(data.students || []).map(row => <option key={row.userId} value={row.userId}>{row.studentCode} — {row.fullName}</option>)}</select></label>
        <label>Thao tác<select name="action"><option value="moderationLeader">Chỉ định Leader</option><option value="moderationAdd">Thêm vào nhóm</option><option value="moderationMove">Chuyển vào nhóm</option><option value="moderationRemove">Đưa ra khỏi nhóm</option></select></label>
        <Input label="Lý do (khi đưa ra)" name="reason" required={false} /><button disabled={busy || !data.groups?.length}>Thực hiện</button>
      </form>
      <h3>Gộp nhóm</h3><form onSubmit={e => submit(e, values =>
        mutate("moderationMerge", {groupId:values.groupId}, {sourceGroupId:values.sourceGroupId}))}>
        <label>Nhóm nhận<select name="groupId">{(data.groups || []).map(group => <option key={group.id} value={group.id}>{group.code}</option>)}</select></label>
        <label>Nhóm chuyển sang<select name="sourceGroupId">{(data.groups || []).map(group => <option key={group.id} value={group.id}>{group.code}</option>)}</select></label>
        <button disabled={busy || (data.groups || []).length < 2}>Gộp nhóm</button>
      </form>
    </section>}
    {!student && tab === "students" && <section><h2>Danh sách sinh viên</h2><div className="row">
      <label>Tìm MSSV, tên, email<input value={query} onChange={e => setQuery(e.target.value)} /></label>
      <label>Lọc<select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
        <option value="all">Tất cả</option><option value="ungrouped">Chưa có nhóm</option><option value="ineligible">Không đủ điều kiện</option>
      </select></label></div><Table rows={shownStudents} columns={[
        ["MSSV", row => row.studentCode], ["Họ tên", row => row.fullName], ["Email", row => row.email],
        ["Ngành", row => row.majorCode], ["Điều kiện", row => row.eligibility], ["Nhóm", row => row.groupCode || "Chưa có"],
      ]} /><h3>Cập nhật điều kiện</h3><form onSubmit={e => submit(e, async values => {
        await mutate("eligibility", {enrollmentId:values.enrollmentId}, {eligibility:values.eligibility, reason:values.reason});
      })}><label>Sinh viên<select name="enrollmentId" required>{shownStudents.map(row =>
        <option key={row.enrollmentId} value={row.enrollmentId}>{row.studentCode} — {row.fullName}</option>)}</select></label>
        <label>Điều kiện<select name="eligibility"><option>ELIGIBLE</option><option>INELIGIBLE</option><option>UNDECIDED</option></select></label>
        <Input label="Lý do" name="reason" /><button disabled={busy || !shownStudents.length}>Cập nhật</button></form></section>}
    {!student && tab === "scopes" && <section><h2>Deadline và chốt theo ngành</h2>
      {(data.subjects || []).map(configuration => <section key={configuration.id}>
        <h3>Thời hạn Apply / Invite: {configuration.requestTtlMinutes} phút</h3>
        <p>Hạn tối thiểu khi đặt deadline mới: {configuration.minDeadlineNoticeMinutes} phút từ hiện tại.</p>
        <p>Chỉnh thời hạn này áp dụng cho đơn/mời mới. Deadline ghép nhóm chỉ thay đổi khi bạn tự lưu bên dưới.</p>
        <form key={configuration.id + "-" + configuration.requestTtlMinutes} onSubmit={e => submit(e, values =>
          mutate("updateSubject", {subjectId: configuration.id}, {requestTtlMinutes: Number(values.requestTtlMinutes)}))}>
          <label>Hạn đơn/mời (phút)<input name="requestTtlMinutes" type="number" min="1" max="20160" step="1" defaultValue={configuration.requestTtlMinutes} required /></label>
          <button disabled={busy}>Lưu thời hạn đơn/mời</button>
          <button type="button" disabled={busy} onClick={() => run(() => mutate("updateSubject", {subjectId:configuration.id}, {requestTtlMinutes:10}), "Đã đổi hạn đơn/mời mới thành 10 phút.")}>Dùng 10 phút</button>
          <button type="button" disabled={busy} onClick={() => run(() => mutate("updateSubject", {subjectId:configuration.id}, {requestTtlMinutes:15}), "Đã đổi hạn đơn/mời mới thành 15 phút.")}>Dùng 15 phút</button>
        </form>
      </section>)}{(data.scopes || []).map(scope =>
      <section key={scope.id}><h3>{scope.majorCode} — {scope.phase}</h3><p>Deadline: {scope.deadline || "Chưa đặt"}</p>
        <form onSubmit={e => submit(e, values => mutate("deadline", {scopeId:scope.id}, {deadline:new Date(values.deadline).toISOString()}))}>
          <Input label="Deadline riêng" name="deadline" type="datetime-local" /><button disabled={busy}>Lưu deadline</button></form>
        <form onSubmit={e => submit(e, values => mutate("extend", {scopeId:scope.id}, {deadline:new Date(values.deadline).toISOString()}))}>
          <Input label="Gia hạn tới" name="deadline" type="datetime-local" /><button disabled={busy}>Gia hạn</button></form>
        <div className="row"><button disabled={busy} onClick={() => run(async () =>
          setDetails(await call("finalizeCheck", {path:{scopeId:scope.id}})), "Đã kiểm tra điều kiện chốt.")}>Kiểm tra chốt</button>
          <button disabled={busy} onClick={() => run(() => mutate("finalize", {scopeId:scope.id}))}>Chốt danh sách</button></div>
        <form onSubmit={e => submit(e, values => mutate("reopen", {scopeId:scope.id}, {reason:values.reason}))}>
          <Input label="Lý do mở lại" name="reason" /><button disabled={busy}>Mở lại danh sách</button></form>
        <button disabled={busy} onClick={() => run(async () => setDetails(await call("complaints",{path:{subjectId:scope.subjectId},params:{scopeId:scope.id}})), "Đã tải khiếu nại.")}>Xem khiếu nại</button>
      </section>)}<Json value={details} />
      <form onSubmit={e => submit(e, values => mutate("moderatorDecision",{requestId:values.requestId},{approve:values.approve==="true",note:values.note}))}>
        <Input label="Mã yêu cầu / khiếu nại" name="requestId" /><label>Quyết định<select name="approve"><option value="true">Duyệt</option><option value="false">Từ chối</option></select></label><Input label="Ghi chú" name="note" required={false} /><button disabled={busy}>Xử lý khiếu nại</button>
      </form></section>}
    {!student && tab === "import" && <section><h2>Import danh sách sinh viên</h2>
      {user?.role !== "ADMIN" ? <p>Chỉ Admin được import danh sách.</p> : <>
        <p>Cột bắt buộc: MSSV, Họ tên, Email, Kỳ (8), Ngành. Điện thoại và điều kiện là tùy chọn.</p>
        <label>File CSV / Excel<input type="file" accept=".csv,.xlsx,.xls" onChange={e => {
          setFile(e.target.files[0] || null); setPreview(null); setImportConfirmed(false);
        }} /></label><div className="row">
        <button disabled={busy || !file} onClick={() => run(async () => {
          setPreview(await call("importPreview", {path,file})); setImportConfirmed(false);
        }, "Đã kiểm tra file; chưa ghi dữ liệu.")}>Kiểm tra file</button>
        <button disabled={busy || !file || !preview || importConfirmed} onClick={() => run(async () => {
          setPreview(await call("importConfirm", {path,file})); setImportConfirmed(true); await load();
        }, "Đã import dữ liệu; xem chi tiết các dòng bị từ chối bên dưới.")}>Xác nhận import</button></div><Json value={preview} />
      </>}</section>}
    {!student && tab === "export" && <section><h2>Thống kê / Excel</h2><Json value={data.statistics} />
      <button disabled={busy} onClick={() => run(async () => setDetails(await call("exportCheck",{path})), "Đã kiểm tra trước xuất.")}>Kiểm tra nhóm thiếu người</button>
      <button disabled={busy} onClick={() => run(async () => {
        const blob = await call("export",{path});
        const url = URL.createObjectURL(blob); const link = document.createElement("a");
        link.href=url; link.download="Nhom_"+semester+".xlsx"; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
      }, "Đã tải Excel.")}>Tải Excel</button><Json value={details} /></section>}
    {!student && tab === "accounts" && user?.role === "ADMIN" && <section><h2>Tạo Moderator</h2>
      <form onSubmit={e => submit(e, async values => {
        const moderator = await call("createModerator", {body:values}); setDetails(moderator);
      })}><Input label="Họ tên" name="fullName" /><Input label="Email" name="email" type="email" />
        <Input label="Mật khẩu (ít nhất 8 ký tự)" name="password" type="password" /><button disabled={busy}>Tạo Moderator</button></form>
      <Json value={details} />
      <h3>Phân công Moderator cho {semester}</h3>
      <p>Mã Moderator được trả về khi tạo tài khoản; chỉ Admin được phân công.</p>
      <form onSubmit={e => submit(e, async values => {
        await call("assignModerator",{path,body:{moderatorId:values.moderatorId}});
        setSemesters(await call("semesters")); await load();
      })}><Input label="Mã Moderator" name="moderatorId" /><button disabled={busy}>Phân công</button></form>
      </section>}
    {student && <p className="muted">Điều kiện: {subject?.eligibility || "Chưa có"} · Giai đoạn: {subject?.phase || "Chưa có"}{own?.readOnly ? " · Học kỳ cũ, chỉ xem" : ""}</p>}
    {student && data.timing && <p className="muted">Thời hạn Apply / Invite: {data.timing.requestTtlMinutes} phút kể từ khi gửi.</p>}
    {student && tab === "groups" && <section><h2>{data.group ? "Nhóm của tôi" : "Bạn chưa có nhóm"}</h2>
      {data.group ? <><p>{data.group.code} — {data.group.name} · {data.group.size}/5 · {data.group.state}</p>
        <Table rows={data.group.members || []} columns={[["MSSV",member=>member.studentCode],["Họ tên",member=>member.fullName],["Vai trò",member=>member.leader?"Leader":"Thành viên"]]} />
        {ownGroup?.leader && <div className="row"><button disabled={busy} onClick={() => run(() => mutate(data.group.locked?"unlock":"lock",{groupId:data.group.id}))}>{data.group.locked?"Mở khóa":"Khóa nhóm"}</button></div>}
        <form onSubmit={e => submit(e,values=>mutate("leave",{groupId:data.group.id},{reason:values.reason}))}>
          <Input label="Lý do rời nhóm" name="reason" /><button disabled={busy}>Rời nhóm / gửi yêu cầu rời</button></form>
        {ownGroup?.leader && <><form onSubmit={e=>submit(e,values=>mutate("invite",{groupId:data.group.id},{studentCode:values.studentCode,message:values.message}))}>
          <Input label="MSSV cần mời" name="studentCode" /><Input label="Lời mời" name="message" required={false} /><button disabled={busy}>Mời thành viên</button></form>
          <form onSubmit={e=>submit(e,values=>mutate("transfer",{groupId:data.group.id},{toUserId:values.toUserId,leaveAfter:false}))}>
            <label>Chuyển Leader<select name="toUserId">{(data.group.members||[]).filter(member=>!member.leader).map(member=>
              <option value={member.userId} key={member.userId}>{member.fullName}</option>)}</select></label><button disabled={busy}>Đề nghị chuyển Leader</button></form></>}
      </> : <><form onSubmit={e=>submit(e,values=>mutate("createGroup",{subjectId:subject?.subjectId},values))}>
        <Input label="Tên nhóm" name="name" /><Input label="Kỹ năng cần tuyển" name="wantedSkills" required={false} /><button disabled={busy || !subject?.canAct}>Tạo nhóm</button></form>
        <Table rows={asList(data.openGroups)} columns={[["Mã nhóm",group=>group.code],["Tên",group=>group.name],["Sĩ số",group=>group.size],
          ["Tham gia",group=><button disabled={busy || !subject?.canAct} onClick={()=>run(()=>mutate("apply",{groupId:group.id},{message:"Xin tham gia nhóm"}))}>Apply</button>]]} /></>}
    </section>}
    {student && tab === "requests" && <section><h2>Apply / Invite</h2><Table rows={[...asList(data.requests),...asList(data.groupRequests)].filter((r,i,all)=>all.findIndex(x=>x.id===r.id)===i)} columns={[
      ["Loại",r=>r.type],["Nhóm",r=>r.groupCode],["MSSV",r=>r.student?.studentCode],["Trạng thái",r=>r.status],["Hết hạn",r=>r.expiresAt ? new Date(r.expiresAt).toLocaleString("vi-VN") : ""],
      ["Xử lý",r=>r.status==="PENDING"?<div className="row">
        {((r.type === "APPLY" && ownGroup?.leader && r.groupId === ownGroup.id) || (r.type === "INVITE" && r.student?.userId === user?.id)) && <button disabled={busy} onClick={()=>run(()=>mutate("accept",{requestId:r.id}))}>Chấp nhận</button>}
        {((r.type === "APPLY" && ownGroup?.leader && r.groupId === ownGroup.id) || (r.type === "INVITE" && r.student?.userId === user?.id)) && <button disabled={busy} onClick={()=>run(()=>mutate("reject",{requestId:r.id}))}>Từ chối</button>}
        {r.createdBy === user?.id && <button disabled={busy} onClick={()=>run(()=>mutate("withdraw",{requestId:r.id}))}>Thu hồi</button>}
      </div>:null],
    ]} /><h3>Yêu cầu rời nhóm</h3><Json value={data.leaveRequests} /><Json value={data.groupLeaveRequests} />
      {ownGroup?.leader && <form onSubmit={e=>submit(e,values=>mutate("leaveDecision",{requestId:values.requestId},{approve:values.approve==="true",note:values.note}))}>
        <Input label="Mã yêu cầu rời" name="requestId" /><label>Quyết định<select name="approve"><option value="true">Duyệt</option><option value="false">Từ chối</option></select></label>
        <Input label="Ghi chú" name="note" required={false} /><button disabled={busy}>Xử lý</button></form>}
      <form onSubmit={e=>submit(e,values=>mutate("complaint",{requestId:values.requestId},{reason:values.reason}))}>
        <Input label="Mã yêu cầu rời" name="requestId" /><Input label="Lý do khiếu nại" name="reason" /><button disabled={busy}>Khiếu nại</button></form>
      <h3>Chuyển Leader</h3><Json value={data.transfers} /><form onSubmit={e=>submit(e,values=>mutate(values.action,{transferId:values.transferId}))}>
        <Input label="Mã đề nghị chuyển" name="transferId" /><label>Quyết định<select name="action"><option value="transferAccept">Đồng ý</option><option value="transferDecline">Từ chối</option><option value="transferCancel">Hủy đề nghị của tôi</option></select></label>
        <button disabled={busy}>Xác nhận</button></form>
    </section>}
    {student && tab === "profile" && <section><h2>Hồ sơ cá nhân</h2>
      <button disabled={busy} onClick={()=>run(async()=>setDetails(await call("profile")),"Đã tải hồ sơ.")}>Xem hồ sơ</button><Json value={details} />
      <form onSubmit={e=>submit(e,values=>mutate("updateProfile",{}, {skills:values.skills,profilePrivate:values.profilePrivate==="true"}))}>
        <Input label="Kỹ năng" name="skills" required={false} /><label>Riêng tư<select name="profilePrivate"><option value="false">Công khai</option><option value="true">Riêng tư</option></select></label><button disabled={busy}>Lưu hồ sơ</button></form>
    </section>}
  </main>;
}

