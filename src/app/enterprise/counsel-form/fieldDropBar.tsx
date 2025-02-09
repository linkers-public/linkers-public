import React, { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const categories = [
  {
    mainCategory: "웹 개발",
    subCategories: [
      "프론트엔드 개발",
      "백엔드 개발",
      "풀스택 개발",
      "API 개발 및 통합"
    ]
  },
  {
    mainCategory: "모바일 앱 개발",
    subCategories: [
      "iOS 앱 개발",
      "안드로이드 앱 개발",
      "크로스플랫폼 앱 개발"
    ]
  },
  {
    mainCategory: "인공지능(AI) 및 머신러닝",
    subCategories: [
      "데이터 분석 및 모델링",
      "컴퓨터 비전",
      "자연어 처리(NLP)"
    ]
  },
  {
    mainCategory: "클라우드 컴퓨팅",
    subCategories: [
      "AWS 인프라 구축 및 관리",
      "Microsoft Azure 서비스 개발",
      "Google Cloud Platform (GCP) 서비스"
    ]
  },
  {
    mainCategory: "UI/UX 디자인",
    subCategories: [
      "와이어프레임 및 프로토타입 제작",
      "사용자 경험 리서치 및 테스트",
      "비주얼 디자인"
    ]
  },
  {
    mainCategory: "데브옵스 및 CI/CD",
    subCategories: [
      "지속적 통합 및 배포 (CI/CD) 파이프라인 구축",
      "인프라 자동화"
    ]
  },
  {
    mainCategory: "보안",
    subCategories: [
      "웹 애플리케이션 보안",
      "네트워크 보안"
    ]
  },
  {
    mainCategory: "데이터베이스 관리",
    subCategories: [
      "SQL 데이터베이스",
      "NoSQL 데이터베이스"
    ]
  }
];

const FieldDropBar = ({
  value = [],
  onChange,
}: {
  value: string[]; // value는 문자열 배열
  onChange: (newValues: string[]) => void; // onChange는 새 문자열 배열을 인수로 받는 함수
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSubCategoryChange = (subCategory: string) => {
    if (value.includes(subCategory)) {
      onChange(value.filter((item) => item !== subCategory));
    } else if (value.length < 3) {
      onChange([...value, subCategory]);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          {selectedCategory ? (
            <>
              {selectedCategory} · {value[0] || ''}
              {value.length > 1 && ` 외 ${value.length - 1}개`}
            </>
          ) : (
            `분야를 선택하세요 (${value.length})`
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>분야 선택</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_1fr] gap-4">
          <div className="border-r pr-4">
            <h4 className="font-medium mb-2">대분류</h4>
            {categories.map((category) => (
              <div
                key={category.mainCategory}
                onClick={() => setSelectedCategory(category.mainCategory)}
                className={`cursor-pointer p-2 hover:bg-gray-50 ${
                  selectedCategory === category.mainCategory ? 'bg-gray-100' : ''
                }`}
              >
                {category.mainCategory}
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium mb-2">소분류</h4>
            {selectedCategory &&
              categories
                .find((c) => c.mainCategory === selectedCategory)
                ?.subCategories.map((subCategory) => (
                  <div
                    key={subCategory}
                    className="flex justify-between items-center p-2 hover:bg-gray-50"
                  >
                    <span>{subCategory}</span>
                    <input
                      type="checkbox"
                      checked={value.includes(subCategory)}
                      onChange={() => handleSubCategoryChange(subCategory)}
                    />
                  </div>
                ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {value.length}/3개 분야가 선택되었습니다
        </div>

        <div className="flex gap-2 mt-2 flex-wrap">
          {value.map((subCategory) => (
            <div
              key={subCategory}
              className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"
            >
              {subCategory}
              <XCircle
                className="h-4 w-4 cursor-pointer"
                onClick={() => onChange(value.filter((j) => j !== subCategory))}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onChange([])}
          >
            초기화
          </Button>
          <DialogClose asChild>
            <Button>선택</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FieldDropBar;
