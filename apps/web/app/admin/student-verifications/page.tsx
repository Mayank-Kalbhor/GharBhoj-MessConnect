'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IconId,
  IconCheck,
  IconX,
  IconExternalLink,
  IconSchool
} from '@tabler/icons-react';

interface StudentSubmission {
  id: string;
  name: string;
  phone: string;
  college: string;
  idCardDocUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const FALLBACK_STUDENTS: StudentSubmission[] = [
  {
    id: 'stud_davv_101',
    name: 'Aarav Sharma',
    phone: '+919876543210',
    college: 'Institute of Engineering & Technology (IET-DAVV), Indore',
    idCardDocUrl: 'https://cdn.messconnect.in/docs/student_id_101.pdf',
    submittedAt: '2026-09-15',
    status: 'PENDING'
  },
  {
    id: 'stud_sgsits_102',
    name: 'Neha Agrawal',
    phone: '+919876543219',
    college: 'SGSITS Park Road, Indore',
    idCardDocUrl: 'https://cdn.messconnect.in/docs/student_id_102.pdf',
    submittedAt: '2026-09-15',
    status: 'PENDING'
  }
];

export default function StudentVerificationsPage() {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(FALLBACK_STUDENTS);
  const [alert, setAlert] = useState<string | null>(null);

  const handleAction = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setSubmissions(prev =>
      prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
    );
    setAlert(`Student ${id} marked as ${newStatus}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Student ID Verification Queue</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Verify Indore collegiate credentials for student subscription tiers
          </p>
        </div>
        <Badge variant="accent" size="md">
          {submissions.filter(s => s.status === 'PENDING').length} Pending Review
        </Badge>
      </div>

      {alert && (
        <div className="p-3 bg-success-bg border border-success-text/30 rounded-card flex items-center gap-2 text-xs text-success-text">
          <IconCheck size={16} stroke={2} />
          <span>{alert}</span>
        </div>
      )}

      <div className="bg-bg-card border border-border-default rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-text-secondary bg-bg-screen border-b border-border-default">
              <tr>
                <th className="py-3 px-4 font-medium">Student Name & Contact</th>
                <th className="py-3 px-4 font-medium">Institution</th>
                <th className="py-3 px-4 font-medium">ID Document</th>
                <th className="py-3 px-4 font-medium">Submission Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {submissions.map(sub => (
                <tr key={sub.id} className="hover:bg-bg-screen/40 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-text-primary">
                    <span>{sub.name}</span>
                    <span className="text-[10px] text-text-secondary block">{sub.phone}</span>
                  </td>

                  <td className="py-3.5 px-4 text-text-primary">
                    <div className="flex items-center gap-1.5">
                      <IconSchool size={14} stroke={1.5} className="text-brand-primary" />
                      <span>{sub.college}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <a
                      href={sub.idCardDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary font-medium flex items-center gap-1 hover:underline"
                    >
                      <span>View ID Card</span>
                      <IconExternalLink size={12} stroke={2} />
                    </a>
                  </td>

                  <td className="py-3.5 px-4 text-text-secondary">
                    {sub.submittedAt}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={sub.status === 'APPROVED' ? 'success' : sub.status === 'REJECTED' ? 'danger' : 'accent'} size="sm">
                      {sub.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {sub.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="primary" size="sm" onClick={() => handleAction(sub.id, 'APPROVED')}>
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleAction(sub.id, 'REJECTED')}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-text-secondary text-[11px]">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
