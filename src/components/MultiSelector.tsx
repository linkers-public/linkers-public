'use client'

import { ChevronDown } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

type MultiSelectorProps = {
  values: string[]
  onChange: (values: string[]) => void
  options: { label: string; value: string }[]
  placeholder?: string
}

const MultiSelector = ({
  values,
  onChange,
  options,
  placeholder,
}: MultiSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSelectChange = (value: string) => {
    const newValues = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value]
    onChange(newValues)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between px-4 py-2 rounded-[12px] shadow-normal min-w-[160px] ${
          values.length > 0
            ? 'border-2 border-solid border-palette-label-normal'
            : ''
        }`}
      >
        <span className="text-p2 text-palette-coolNeutral-40">
          {values.length > 0
            ? values.length === 1
              ? options.find((o) => o.value === values[0])?.label
              : `${options.find((o) => o.value === values[0])?.label} 외 ${
                  values.length - 1
                }개`
            : placeholder}
        </span>
        <ChevronDown />
      </button>

      {/* Dropdown Select */}
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white rounded-[12px] shadow-normal mt-2">
          {options.map((option) => (
            <li
              key={option.value}
              className="flex items-center px-4 py-2 cursor-pointer hover:bg-palette-coolNeutral-98"
              onClick={() => handleSelectChange(option.value)}
            >
              <input
                type="checkbox"
                checked={values.includes(option.value)}
                readOnly
                className="mr-2"
              />
              <p className="text-p2">{option.label}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MultiSelector
