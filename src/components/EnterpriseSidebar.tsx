import React from 'react';

const EnterpriseSidebar = () => {
  return (
    <div className="w-64 h-screen bg-white shadow-lg flex flex-col justify-between p-6">
      
      {/* 메뉴 항목 */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 text-base font-medium text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-gray-100 p-3 rounded-md transition-all">
          <span>보낸 프로젝트</span>
        </div>
        <div className="flex items-center gap-3 text-base font-medium text-gray-600 cursor-pointer hover:text-blue-600 hover:bg-gray-100 p-3 rounded-md transition-all">
          <span>완료 프로젝트</span>
        </div>
        
      </div>
    </div>
  );
};

export default EnterpriseSidebar;
