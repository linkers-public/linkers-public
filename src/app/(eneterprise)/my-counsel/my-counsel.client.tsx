import React from "react";

const ProjectList = () => {
  const projects = [
    { title: "프로젝트명(상담서 제목)", status: "상담 중" },
    { title: "프로젝트명(상담서 제목)", status: "진행 중" },
    { title: "프로젝트명(상담서 제목)", status: "정산 대기" },
    { title: "프로젝트명(상담서 제목)", status: "정산 완료" },
  ];

  return (
    <div style={{ padding: "20px" }}>
      {/* Filter Section */}
      <div
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px",
      }}
    >
      {/* First Filter */}
      <div style={{ position: "relative", width: "120px" }}>
        <select
          style={{
            width: "100%",
            height: "40px",
            border: "1px solid #000",
            borderRadius: "20px",
            padding: "0 10px",
            fontSize: "14px",
            cursor: "pointer",
            appearance: "none",
            backgroundColor: "#fff",
            textAlign: "center",
            outline: "none",
          }}
        >
          <option>필터 1</option>
          <option>옵션 1</option>
          <option>옵션 2</option>
          <option>옵션 3</option>
        </select>
        {/* Dropdown Icon */}
        <span
          style={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: "12px",
          }}
        >
          ▼
        </span>
      </div>

      {/* Second Filter */}
      <div style={{ position: "relative", width: "120px" }}>
        <select
          style={{
            width: "100%",
            height: "40px",
            border: "1px solid #000",
            borderRadius: "20px",
            padding: "0 10px",
            fontSize: "14px",
            cursor: "pointer",
            appearance: "none",
            backgroundColor: "#fff",
            textAlign: "center",
            outline: "none",
          }}
        >
          <option>필터 2</option>
          <option>옵션 1</option>
          <option>옵션 2</option>
          <option>옵션 3</option>
        </select>
        <span
          style={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: "12px",
          }}
        >
          ▼
        </span>
      </div>

      {/* Third Filter */}
      <div style={{ position: "relative", width: "120px" }}>
        <select
          style={{
            width: "100%",
            height: "40px",
            border: "1px solid #000",
            borderRadius: "20px",
            padding: "0 10px",
            fontSize: "14px",
            cursor: "pointer",
            appearance: "none",
            backgroundColor: "#fff",
            textAlign: "center",
            outline: "none",
          }}
        >
          <option>필터 3</option>
          <option>옵션 1</option>
          <option>옵션 2</option>
          <option>옵션 3</option>
        </select>
        <span
          style={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            fontSize: "12px",
          }}
        >
          ▼
        </span>
      </div>
    </div>

      {/* Left Section: Project Details */}
      
      {projects.map((project, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #000", // Black border for card style
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "10px",
            backgroundColor: "#fff",
          }}
        >
          {/* Left Section: Project Details */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            {/* Icon */}
            <div
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#f2f2f2",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src="placeholder-icon.png"
                alt="Project Icon"
                style={{ width: "30px", height: "30px" }}
              />
            </div>

            {/* Text Content */}
            <div>
              <h3 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>
                {project.title}
              </h3>
              <p style={{ margin: "0 0 5px 0", color: "#888", fontSize: "14px" }}>
                프로젝트 진행 기간<br />
                예상 비용
              </p>
              <p
                style={{
                  margin: "0",
                  color: "#555",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                상담 내용을 요약한 내용 요약상담 내용을 요약한 내용 요약상담 내용을 요약한
                내용 요약...
              </p>
            </div>
          </div>

          {/* Right Section: Status */}
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                padding: "5px 15px",
                borderRadius: "15px",
                backgroundColor: getStatusColor(project.status),
                color: "#fff",
                fontSize: "14px",
                marginBottom: "5px",
              }}
            >
              {project.status}
            </span>
            <p style={{ margin: "0", fontSize: "12px", color: "#888" }}>
              {project.team}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Function to determine status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "상담 중":
      return "#ff9800"; // Orange
    case "진행 중":
      return "#4caf50"; // Green
    case "정산 대기":
      return "#fbc02d"; // Yellow
    case "정산 완료":
      return "#2196f3"; // Blue
    default:
      return "#999"; // Default Gray
  }
};

export default ProjectList;
