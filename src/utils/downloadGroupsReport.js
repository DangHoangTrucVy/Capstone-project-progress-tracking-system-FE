// import { exportGroupsExcel } from "../services/groupService";

// // Shared by both report screens. Never save an API error page as an Excel file.
// export async function downloadGroupsReport(semester) {
//   const selectedSemester = semester.trim();

//   let response;
//   try {
//     response = await exportGroupsExcel(selectedSemester || undefined);
//   } catch (error) {
//     if ([404, 405, 501].includes(error.response?.status)) {
//       throw new Error("API xuất Excel chưa sẵn sàng trên máy chủ. Vui lòng thử lại sau khi Backend triển khai.", { cause: error });
//     }
//     if (error.response?.status === 401) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", { cause: error });
//     if (error.response?.status === 403) throw new Error("Bạn không có quyền xuất báo cáo Excel.", { cause: error });
//     const data = error.response?.data;
//     if (data instanceof Blob && /json/i.test(data.type)) {
//       const payload = await data.text().then(JSON.parse).catch(() => null);
//       if (payload?.message) throw new Error(payload.message, { cause: error });
//     }
//     throw new Error(data?.message || "Không thể xuất báo cáo Excel. Vui lòng kiểm tra kết nối và quyền truy cập.", { cause: error });
//   }

//   const blob = response.data;
//   if (response.status !== 200 || !response.headers['content-type']?.includes('spreadsheetml') || !(blob instanceof Blob) || !blob.size) {
//     const payload = blob instanceof Blob ? await blob.text().then(JSON.parse).catch(() => null) : blob;
//     throw new Error(payload?.message || "Máy chủ chưa trả về file Excel hợp lệ.");
//   }

//   const now = new Date();
//   const pad = (value) => String(value).padStart(2, "0");
//   const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
//   const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
//   const safeSemester = (selectedSemester || 'Tat_ca').replace(/[^a-zA-Z0-9_-]/g, "_");
//   const disposition = response.headers['content-disposition'] || '';
//   const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
//   let serverName = /filename="([^"]+)"/i.exec(disposition)?.[1];
//   if (encodedName) {
//     try { serverName = decodeURIComponent(encodedName); } catch { /* Use the plain filename or fallback. */ }
//   }
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   try {
//     link.href = url;
//     link.download = serverName?.split(/[\\/]/).pop() || `Danh_sach_ghep_nhom_${safeSemester}_${date}_${time}.xlsx`;
//     document.body.appendChild(link);
//     link.click();
//   } finally {
//     link.remove();
//     // Allow the browser to start consuming the object URL before releasing it.
//     setTimeout(() => URL.revokeObjectURL(url), 1000);
//   }
// }

import * as XLSX from "xlsx-js-style";
import {
  getAllGroups,
  getGroupById,
  getGroupMembers,
} from "../services/groupService";
import { getUsers } from "../services/userService";
import { getIneligibleStudents } from "../services/eligibilityService";

const GROUP_HEADERS = [
  "STT",
  "Mã Nhóm",
  "Học Kỳ",
  "Trạng Thái Nhóm",
  "Khóa danh sách",
  "Số thành viên",
  "Họ và Tên",
  "MSSV",
  "Email",
  "Vai trò",
];

const ELIGIBLE_HEADERS = [
  "STT",
  "MSSV",
  "Họ và Tên",
  "Email",
  "Đủ điều kiện",
  "Trạng thái tài khoản",
];

const INELIGIBLE_HEADERS = [
  "STT",
  "MSSV",
  "Họ và Tên",
  "Email",
  "Đủ điều kiện",
  "Lý do",
  "Trạng thái tài khoản",
];

const unwrap = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const text = (value) => String(value ?? "");

const studentCode = (user) =>
  text(
    user?.studentCode ??
      user?.student?.studentCode ??
      user?.user?.studentCode ??
      user?.mssv ??
      user?.studentId,
  );

const fullName = (user) =>
  text(
    user?.userFullName ??
      user?.fullName ??
      user?.student?.fullName ??
      user?.user?.fullName ??
      user?.studentName ??
      user?.name,
  );

const email = (user) =>
  text(
    user?.userEmail ?? user?.email ?? user?.user?.email ?? user?.student?.email,
  );

const accountStatus = (user) => text(user?.status ?? user?.accountStatus);

const formatAccountStatus = (user) => {
  const status = text(user?.status ?? user?.accountStatus ?? user?.userStatus)
    .trim()
    .toUpperCase();

  if (["ACTIVE", "ENABLED"].includes(status)) {
    return "Đang hoạt động";
  }

  if (["INACTIVE", "DISABLED", "SUSPENDED", "BLOCKED"].includes(status)) {
    return "Vô hiệu hóa";
  }

  return status || "Không xác định";
};

const eligibility = (user) => {
  const value = user?.eligible ?? user?.isEligible ?? user?.eligibilityStatus;

  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (["TRUE", "ELIGIBLE"].includes(normalized)) return true;
    if (["FALSE", "INELIGIBLE", "NOT_ELIGIBLE"].includes(normalized)) {
      return false;
    }
  }
  return null;
};

const identityKeys = (user) =>
  [
    user?.id,
    user?.userId,
    user?.studentId,
    user?.studentCode,
    user?.student?.studentCode,
    user?.mssv,
    user?.userEmail,
    user?.email,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => text(value).trim().toLowerCase());

const getMembers = (group) =>
  Array.isArray(group?.members) ? group.members : [];

function createSheet(headers, rows, widths, options = {}) {
  const { groupColumn = -1 } = options;
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const COLORS = {
    header: "D9A27F",
    headerBorder: "C98C68",
    white: "FFFFFF",
    beige: "F7F1EB",
    line: "E8DED5",
    text: "403832",
    groupLine: "C98C68",
  };

  sheet["!cols"] = widths.map((wch) => ({ wch }));
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  sheet["!rows"] = [{ hpt: 32 }];

  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: {
        r: Math.max(rows.length, 0),
        c: headers.length - 1,
      },
    }),
  };

  const borderBottom = (color) => ({
    style: "thin",
    color: { rgb: color },
  });

  // Header
  headers.forEach((_, column) => {
    const address = XLSX.utils.encode_cell({ r: 0, c: column });
    if (!sheet[address]) return;

    sheet[address].s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: COLORS.header },
      },
      font: {
        bold: true,
        color: { rgb: COLORS.white },
        sz: 11,
        name: "Arial",
      },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: borderBottom(COLORS.headerBorder),
      },
    };
  });

  const centeredHeaders = [
    "STT",
    "Học Kỳ",
    "Học kỳ",
    "Trạng Thái Nhóm",
    "Khóa danh sách",
    "Số thành viên",
    "Đủ điều kiện",
    "Vai trò",
  ];

  // Data rows
  rows.forEach((row, rowIndex) => {
    const excelRow = rowIndex + 1;
    const isAlternate = rowIndex % 2 === 1;

    const currentGroup = groupColumn >= 0 ? row[groupColumn] : undefined;
    const previousGroup =
      groupColumn >= 0 && rowIndex > 0
        ? rows[rowIndex - 1][groupColumn]
        : undefined;

    const isNewGroup =
      groupColumn >= 0 && rowIndex > 0 && currentGroup !== previousGroup;

    if (isNewGroup) {
      sheet["!rows"][excelRow] = { hpt: 25 };
    } else {
      sheet["!rows"][excelRow] = { hpt: 23 };
    }

    row.forEach((value, column) => {
      const address = XLSX.utils.encode_cell({
        r: excelRow,
        c: column,
      });

      if (!sheet[address]) return;

      const header = headers[column];
      const isCentered = centeredHeaders.includes(header);

      sheet[address].s = {
        fill: {
          patternType: "solid",
          fgColor: {
            rgb: isAlternate ? COLORS.beige : COLORS.white,
          },
        },
        font: {
          name: "Arial",
          sz: 10,
          color: { rgb: COLORS.text },
        },
        alignment: {
          horizontal: isCentered ? "center" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: borderBottom(isNewGroup ? COLORS.groupLine : COLORS.line),
          ...(isNewGroup
            ? {
                top: {
                  style: "medium",
                  color: { rgb: COLORS.groupLine },
                },
              }
            : {}),
        },
      };
    });
  });

  // Preserve student codes as text, including leading zeroes.
  const codeColumn = headers.indexOf("MSSV");

  if (codeColumn >= 0) {
    rows.forEach((_, index) => {
      const address = XLSX.utils.encode_cell({
        r: index + 1,
        c: codeColumn,
      });

      if (sheet[address]) {
        sheet[address].t = "s";
        sheet[address].v = String(sheet[address].v ?? "");
        sheet[address].z = "@";
      }
    });
  }

  return sheet;
}

export async function downloadGroupsReport(semester = "") {
  const selectedSemester = text(semester).trim();

  const [groupsResponse, usersResponse, ineligibleResponse] = await Promise.all(
    [getAllGroups(), getUsers({ size: 1000 }), getIneligibleStudents()],
  );

  const groupsData = groupsResponse?.data ?? groupsResponse;

  const groups = Array.isArray(groupsData)
    ? groupsData
    : Array.isArray(groupsData?.content)
      ? groupsData.content
      : [];

  const users = unwrap(usersResponse);
  const ineligible = unwrap(ineligibleResponse);

  const detailedGroups = await Promise.all(
    groups.map(async (group) => {
      try {
        const [detail, membersResponse] = await Promise.all([
          getGroupById(group.id),
          getGroupMembers(group.id),
        ]);

        const members = unwrap(membersResponse);

        console.log("GROUP DETAIL:", detail);
        console.log("GROUP MEMBERS:", members);

        return {
          ...group,
          ...detail,
          members,
        };
      } catch (error) {
        console.error(
          `Không lấy được thành viên nhóm ${group.groupCode}:`,
          error,
        );

        return group;
      }
    }),
  );

  const filteredGroups = detailedGroups.filter((group) => {
    const groupSemester = text(group?.semester ?? group?.term);
    return (
      !selectedSemester ||
      groupSemester.toLowerCase() === selectedSemester.toLowerCase()
    );
  });

  const groupedKeys = new Set();
  const groupRows = [];

  filteredGroups.forEach((group, index) => {
    const members = getMembers(group).filter((member) => {
      const status = text(member?.status ?? member?.memberStatus).toUpperCase();
      return !status || status === "ACTIVE";
    });

    const rowsToWrite = members.length ? members : [null];

    rowsToWrite.forEach((member) => {
      const person = member ? (member.user ?? member.student ?? member) : {};

      if (member) {
        identityKeys(person).forEach((key) => groupedKeys.add(key));
      }

      const role = member
        ? member.isLeader === true ||
          text(member.role).toUpperCase().includes("LEADER")
          ? "Leader"
          : "Member"
        : "";

      groupRows.push([
        index + 1,
        group?.groupCode ?? group?.code ?? "",
        group?.semester ?? group?.term ?? "",
        group?.status ?? group?.groupStatus ?? "",
        (group?.rosterLocked ?? group?.isRosterLocked ?? group?.locked) === true
          ? "Có"
          : (group?.rosterLocked ?? group?.isRosterLocked ?? group?.locked) ===
              false
            ? "Không"
            : "",
        members.length,
        fullName(person),
        studentCode(person),
        email(person),
        role,
      ]);
    });
  });

  const ineligibleKeys = new Set(
    ineligible.flatMap((user) => identityKeys(user)),
  );

  const studentUsers = users.filter((user) => {
    const role = text(user?.role ?? user?.userRole).toUpperCase();
    return ["STUDENT", "GROUP_LEADER", "LEADER"].includes(role);
  });

  const uniqueUsers = new Map();
  studentUsers.forEach((user) => {
    const key =
      studentCode(user).toLowerCase() ||
      email(user).toLowerCase() ||
      text(user.id);

    if (key && !uniqueUsers.has(key)) uniqueUsers.set(key, user);
  });

  const withoutGroup = [...uniqueUsers.values()].filter(
    (user) => !identityKeys(user).some((key) => groupedKeys.has(key)),
  );

  const eligibleRows = [];
  const ineligibleRows = [];

  withoutGroup.forEach((user) => {
    const keys = identityKeys(user);
    const matched = ineligible.find((candidate) => {
      const candidateKeys = identityKeys(candidate);
      return keys.some((key) => candidateKeys.includes(key));
    });

    const isIneligible =
      Boolean(matched) ||
      keys.some((key) => ineligibleKeys.has(key)) ||
      eligibility(user) === false;

    if (isIneligible) {
      const source = matched ?? user;
      ineligibleRows.push([
        ineligibleRows.length + 1,
        studentCode(user),
        fullName(user),
        email(user),
        "Không Đủ",
        "Không đủ điều kiện làm đồ án",
        formatAccountStatus(user),
      ]);
    } else {
      eligibleRows.push([
        eligibleRows.length + 1,
        studentCode(user),
        fullName(user),
        email(user),
        "Đủ",
        formatAccountStatus(user),
      ]);
    }
  });

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    createSheet(
      GROUP_HEADERS,
      groupRows,
      [8, 18, 16, 20, 16, 16, 26, 18, 32, 14],
      { groupColumn: 1 },
    ),
    "Danh_sach_nhom",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    createSheet(ELIGIBLE_HEADERS, eligibleRows, [8, 18, 26, 32, 18, 22]),
    "Chua_co_nhom",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    createSheet(
      INELIGIBLE_HEADERS,
      ineligibleRows,
      [8, 18, 26, 32, 18, 45, 22],
    ),
    "Khong_du_dieu_kien",
  );

  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const safeSemester = (selectedSemester || "Tat_ca").replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );

  XLSX.writeFile(
    workbook,
    `Danh_sach_ghep_nhom_${safeSemester}_${date}_${time}.xlsx`,
  );
}

export default downloadGroupsReport;
