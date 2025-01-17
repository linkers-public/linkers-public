'use client';

import React, { useState } from 'react';

const ConsultationForm: React.FC = () => {
  const [rows, setRows] = useState([
    { startDate: '', endDate: '', task: '', cost: '', output: '', progress: '' },
    { startDate: '', endDate: '', task: '', cost: '', output: '', progress: '100' },
  ]);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];

    if (index === rows.length - 1 && field === 'progress') {
      // Prevent changes to the progress of the last row
      return;
    }

    newRows[index][field] = value;

    // Ensure the last row's progress remains 100%
    if (field === 'progress' && index !== rows.length - 1) {
      newRows[rows.length - 1].progress = '100';
    }

    setRows(newRows);
  };

  const addRow = () => {
    const newRow = { startDate: '', endDate: '', task: '', cost: '', output: '', progress: '' };
    const updatedRows = [...rows.slice(0, -1), newRow, rows[rows.length - 1]];
    setRows(updatedRows);
  };

  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(updatedRows);
  };

  return (
    <div
      style={{
        width: '700px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>상담 요청서</h2>

      {/* 고객사 이름 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>고객사 이름</label>
        <input
          type="text"
          placeholder="귀하의 회사를 적어주세요 예: SK 이노베이션 레벨리 사원님"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 예산 견적 비용 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>예산 견적 비용</label>
        <input
          type="text"
          placeholder="견적 비용을 적어주세요 (10만원 ~ 1000만원단위)"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 프로젝트 기간 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>프로젝트 기간을 적어주세요</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
          <span style={{ alignSelf: 'center' }}>부터</span>
          <input
            type="date"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
          <span style={{ alignSelf: 'center' }}>까지</span>
        </div>
      </div>

      {/* 분야 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>분야</label>
        <input
          type="text"
          placeholder="분야를 입력하세요"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 상담 내용 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>상담 내용</label>
        <textarea
          placeholder="상담 내용을 적어주세요"
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 이메일 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>이메일</label>
        <input
          type="email"
          placeholder="이메일을 적어주세요"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 최종 도출안 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>최종 도출안</label>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #ddd',
          }}
        >
          <thead>
            <tr>
              <th style={tableCellStyle}>작업 시작일</th>
              <th style={tableCellStyle}>작업 종료일</th>
              <th style={tableCellStyle}>작업 항목</th>
              <th style={tableCellStyle}>발생액</th>
              <th style={tableCellStyle}>산출물</th>
              <th style={tableCellStyle}>달성률 (%)</th>
              <th style={tableCellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td style={tableCellStyle}>
                  <input
                    type="date"
                    value={row.startDate}
                    onChange={(e) => handleInputChange(index, 'startDate', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tableCellStyle}>
                  <input
                    type="date"
                    value={row.endDate}
                    onChange={(e) => handleInputChange(index, 'endDate', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tableCellStyle}>
                  <input
                    type="text"
                    value={row.task}
                    onChange={(e) => handleInputChange(index, 'task', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tableCellStyle}>
                  <input
                    type="text"
                    value={row.cost}
                    onChange={(e) => handleInputChange(index, 'cost', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tableCellStyle}>
                  <input
                    type="text"
                    value={row.output}
                    onChange={(e) => handleInputChange(index, 'output', e.target.value)}
                    style={inputStyle}
                  />
                </td>
                <td style={tableCellStyle}>
                  <input
                    type="number"
                    value={row.progress}
                    onChange={(e) => handleInputChange(index, 'progress', e.target.value)}
                    style={inputStyle}
                    disabled={index === rows.length - 1}
                  />
                </td>
                <td style={tableCellStyle}>
                  {index !== 0 && index !== rows.length - 1 && (
                    <button
                      onClick={() => deleteRow(index)}
                      style={{
                        backgroundColor: '#ff4d4f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      X
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={addRow}
          style={{
            marginTop: '10px',
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          행 추가
        </button>
      </div>

      {/* 비용 범위 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>비용 범위</label>
        <textarea
          placeholder="비용 범위를 적어주세요"
          style={{
            width: '100%',
            height: '80px',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 하단 버튼 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
      }}>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0ad4e',
            color: '#fff',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          임시저장
        </button>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#d9534f',
            color: '#fff',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '10px',
  textAlign: 'center',
};

const inputStyle = {
  width: '100%',
  padding: '5px',
  border: '1px solid #ddd',
  borderRadius: '3px',
};

export default ConsultationForm;
