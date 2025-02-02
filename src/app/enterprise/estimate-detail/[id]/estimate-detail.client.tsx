'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // useParams로 URL 매개변수 추출
import { fetchCounselWithClient } from '@/apis/counsel.service';
import { insertEstimate } from '@/apis/estimate.service'


const ConsultationForm: React.FC = () => {
  const [counsel, setCounsel] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([
    { startDate: '', endDate: '', days: 0, title: '', detail: '', cost: '', output: '', progress: '' },
    { startDate: '', endDate: '', days: 0, title: '', detail: '', cost: '', output: '', progress: '100' },
  ]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const params = useParams(); // useParams를 사용하여 URL의 매개변수 추출
  const [loading, setLoading] = useState(true);
  const counselId = params?.id; // URL에서 id 추출
  const [detailEstimate, setDetailEstimate] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [budget, setBudget] = useState(0);
  const clientId = 'baa0fd5e-4add-44f2-b1df-1ec59a838b7e'
  // 날짜와 비용을 처리하는 함수들
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectStartDate(e.target.value);  // e.target.value로 값을 받아옴
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectEndDate(e.target.value);  // e.target.value로 값을 받아옴
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(Number(e.target.value));  // 숫자로 변환하여 상태 업데이트
  };

  const handleDetailEstimateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetailEstimate(e.target.value);  // 숫자로 변환하여 상태 업데이트
  };


  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  

  useEffect(() => {
    const fetchData = async () => {
      if (!counselId) {
        console.error('counselId가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      try {
        const result = await fetchCounselWithClient(Number(counselId));
        if (result?.counsel) {
          setCounsel(result.counsel);
          setClient(result.client);
        }
      } catch (error) {
        console.error('Error fetching counsel details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [counselId]);

  // 마일스톤 데이터 변경 함수
  const handleInputChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];

    // 해당 인덱스의 특정 필드를 업데이트
    newRows[index][field] = value;

    setRows(newRows);
  };

  const addRow = () => {
    const newRow = { startDate: '', endDate: '', days: 0, title: '', detail: '', cost: '', output: '', progress: '' };
    const updatedRows = [...rows.slice(0, -1), newRow, rows[rows.length - 1]];
    setRows(updatedRows);
  };

  const deleteRow = (index: number) => {
    const updatedRows = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(updatedRows);
  };

  // 임시저장 버튼 클릭 시 API 호출
  const handleSaveDraft = async () => {

    console.log("milestone: " + rows)
    const estimateData = {
      clientId,
      counselId,
      projectStartDate,
      projectEndDate,
      budget,
      detailEstimate,
      milestones: rows, // 마일스톤 데이터
    };



    try {
      await insertEstimate(estimateData); // 데이터 전달
      alert('임시저장 완료되었습니다.');
      router.push('/search-projects'); // 임시저장 후 검색 페이지로 이동
    } catch (error) {
      console.error('임시저장 실패:', error);
    }
  };


  if (loading) {
    return <p>Loading...</p>;
  }

  if (!counsel) {
    return <p>상담 내용을 불러올 수 없습니다.</p>;
  }

  return (
    <div
      style={{
        width: '1500px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid ',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: 18 }}>상담서 내용 보기</h2>
        <button
          onClick={toggleCollapse}
          style={{
            padding: '5px 10px',
            backgroundColor: '#fff', // 버튼 배경 흰색
            color: '#000', // 텍스트 색 검정
            borderRadius: '5px', // 모서리 둥글게
            border: '1px solid #ddd', // 연한 회색 테두리
            cursor: 'pointer',
            fontSize: '14px', // 텍스트 크기
            fontWeight: 'bold', // 텍스트 굵게
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', // 약간의 그림자 추가
          }}
        >
          {isCollapsed ? '펼치기' : '접기'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* 고객사 이름 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#888' }}>고객사 이름</label>
            <div style={{ color: '#888' }}>
              {client?.name || 'Unknown Company'}
            </div>
          </div>


          {/* 이메일 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#888' }}>이메일</label>
            <div style={{ color: '#888' }}>{client?.email || 'Unknown Email'}</div>
          </div>

          {/* 분야 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#888' }}>분야</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[counsel.field].map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '5px 15px',
                    borderRadius: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f9f9f9',
                    color: '#888',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* 상담 내용 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#888' }}>상담 내용</label>
            <div style={{ color: '#888' }}>
              {counsel?.outline || 'Unknown Detail'}
            </div>
          </div>

          {/* 최종 도출안 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#888' }}>최종 도출안</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', color: '#888' }}>
              {[counsel.output].map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '5px 15px',
                    borderRadius: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f9f9f9',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* 프로젝트 기간 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#888' }}>프로젝트 기간을 적어주세요</label>
            <div style={{ display: 'flex', gap: '10px', color: '#888' }}>
              {[counsel.period].map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '5px 15px',
                    borderRadius: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f9f9f9',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* 예상 견적 비용 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#888' }}>예상 견적 비용</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', color: '#888' }}>
              {[counsel.cost].map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '5px 15px',
                    borderRadius: '20px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f9f9f9',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </>
      )}


      {/* 가로선 */}
      <hr style={{ border: '1px solid', marginBottom: '20px' }} />

      {/* Project Schedule */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>프로젝트 일정</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="date"
            value={projectStartDate}
            onChange={handleStartDateChange}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
          <span>~</span>
          <input
            type="date"
            value={projectEndDate}
            onChange={handleEndDateChange}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
        </div>
      </div>

      {/* Budget Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>견적 비용</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            value={budget}
            onChange={handleBudgetChange}
            placeholder="비용을 입력하세요."
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
          <span>원</span>
        </div>
      </div>


      {/* 마일스톤 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>마일스톤</label>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #ddd',
            }}
          >
            <thead
              style={{
                backgroundColor: '#f9f9f9',
              }}
            >
              <tr>
                {/* <th style={{ ...tableCellStyle, width: '5%' }}>작업 시작일</th>
          <th style={{ ...tableCellStyle, width: '5%' }}>작업 종료일</th> */}
                <th style={{ ...tableCellStyle, width: '5%' }}>작업 소요시간(일)</th>
                <th style={{ ...tableCellStyle, width: '10%' }}>마일스톤 제목</th>
                <th style={{ ...tableCellStyle, width: '50%' }}>작업 항목</th>
                <th style={{ ...tableCellStyle, width: '10%' }}>산출물</th>
                <th style={{ ...tableCellStyle, width: '10%' }}>가격</th>
                <th style={{ ...tableCellStyle, width: '10%' }}>달성률 (%)</th>
                <th style={{ ...tableCellStyle, width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {/* <td style={tableCellStyle}>
              <input
                type="date"
                value={row.startDate}
                onChange={(e) => handleInputChange(index, 'startDate', e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </td>
            <td style={tableCellStyle}>
              <input
                type="date"
                value={row.endDate}
                onChange={(e) => handleInputChange(index, 'endDate', e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              />
            </td> */}
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={row.days}
                      onChange={(e) => handleInputChange(index, 'days', e.target.value)}
                      placeholder="0"
                      style={{
                        ...inputStyle,
                        width: '100%',
                        textAlign: 'center',
                      }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <textarea
                      value={row.title}
                      onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                      placeholder="제목을 입력하세요"
                      style={{
                        ...inputStyle,
                        width: '100%',
                        resize: 'vertical',
                        minHeight: '40px',
                      }}

                    />
                  </td>
                  <td style={tableCellStyle}>
                    <textarea
                      value={row.detail}
                      onChange={(e) => handleInputChange(index, 'detail', e.target.value)}
                      placeholder="작업 항목을 입력하세요"
                      style={{
                        ...inputStyle,
                        width: '100%',
                        resize: 'vertical',
                        minHeight: '40px',
                      }}
                      rows={1}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input
                      type="text"
                      value={row.output}
                      onChange={(e) => handleInputChange(index, 'output', e.target.value)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={row.cost}
                      onChange={(e) => handleInputChange(index, 'cost', e.target.value)}
                      placeholder="0"
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={row.progress}
                      onChange={(e) => handleInputChange(index, 'progress', e.target.value)}
                      placeholder="0"
                      style={{ ...inputStyle, width: '100%' }}
                      disabled={index === rows.length - 1}
                    />
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                    {index !== 0 && index !== rows.length - 1 && (
                      <button
                        onClick={() => deleteRow(index)}
                        style={{
                          backgroundColor: '#ff4d4f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: 0,
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
        </div>

        {/* 총 가격 표시 */}
        <div style={{ marginTop: '20px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>
          총 가격: {rows.reduce((total, row) => total + (parseFloat(row.cost) || 0), 0).toLocaleString()} 원
        </div>

        {/* 행 추가 버튼 */}
        <button
          onClick={addRow}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50', // 초록색 배경
            color: '#fff', // 흰색 텍스트
            borderRadius: '25px', // 완전한 둥근 모서리
            border: 'none',
            fontSize: '16px', // 텍스트 크기
            fontWeight: 'bold', // 굵은 텍스트
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px', // 아이콘과 텍스트 간격
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // 살짝 그림자
            transition: 'background-color 0.3s ease, transform 0.2s ease', // hover 효과 추가
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#45A049')} // hover 시 배경 색 변경
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')} // hover 해제 시 원래 색
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')} // 클릭 시 버튼 크기 축소
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')} // 클릭 해제 시 원래 크기
        >
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> 행 추가
        </button>
      </div>

      {/* Detailed Estimate */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>견적 상세 내용</label>
        <textarea
          placeholder="상세 내용을 적어주세요."
          value={detailEstimate}
          onChange={handleDetailEstimateChange}
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>




      {/* 하단 버튼 */}
      < div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '20px',
      }}>
        <button
          onClick={handleSaveDraft}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0ad4e',
            color: '#fff',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          견적서 전송
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
      </div >
    </div >
  );
};

const tableCellStyle = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center' as 'center' | 'left' | 'right',  // 타입 지정
};


const inputStyle = {
  width: '100%',
  padding: '5px',
  border: '1px solid #ddd',
  borderRadius: '3px',
};

export default ConsultationForm;
