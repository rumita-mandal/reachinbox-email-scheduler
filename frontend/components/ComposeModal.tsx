'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { Upload, FileText, X, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from './ui/Toast';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [emailCount, setEmailCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    subject: '',
    body: '',
    senderEmail: '',
    senderName: 'ReachInbox',
    startTime: '',
    delayBetweenEmailsMs: 2000,
    hourlyLimit: 200,
  });

  // Populate startTime on client only (avoids Next.js prerender warning)
  useEffect(() => {
    setForm((f) => ({
      ...f,
      startTime: new Date(Date.now() + 60000).toISOString().slice(0, 16),
    }));
  }, []);

  const parseEmailsFromCsv = async (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const emailRegex = /[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/g;
        const matches = text.match(emailRegex) || [];
        const unique = [...new Set(matches.map((e) => e.toLowerCase().trim()))];
        resolve(unique.length);
      };
      reader.readAsText(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast('Please upload a CSV or TXT file', 'error');
      return;
    }
    setCsvFile(file);
    const count = await parseEmailsFromCsv(file);
    setEmailCount(count);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast('Please upload a CSV file with email recipients', 'error');
      return;
    }
    if (!form.subject || !form.body) {
      toast('Subject and body are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await api.scheduleEmails({
        ...form,
        csvFile,
      });
      toast(`✓ Scheduled ${result.scheduledCount} emails successfully!`, 'success');
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to schedule emails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCsvFile(null);
    setEmailCount(null);
    setForm({
      subject: '',
      body: '',
      senderEmail: '',
      senderName: 'ReachInbox',
      startTime: new Date(Date.now() + 60000).toISOString().slice(0, 16),
      delayBetweenEmailsMs: 2000,
      hourlyLimit: 200,
    }); // resetForm runs client-side only, so Date.now() is safe here
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose & Schedule Emails" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sender Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Sender Name"
            value={form.senderName}
            onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
            placeholder="ReachInbox"
          />
          <Input
            label="Sender Email (optional)"
            type="email"
            value={form.senderEmail}
            onChange={(e) => setForm((f) => ({ ...f, senderEmail: e.target.value }))}
            placeholder="auto-generated via Ethereal"
          />
        </div>

        {/* Subject */}
        <Input
          label="Subject *"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Your email subject line"
          required
        />

        {/* Body */}
        <Textarea
          label="Email Body *"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder="Write your email content here... (HTML supported)"
          className="min-h-[140px]"
          required
        />

        {/* CSV Upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Recipients CSV *
          </label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-violet-500 bg-violet-500/10'
                : csvFile
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-white/10 hover:border-white/20 hover:bg-white/2'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {csvFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-emerald-400">{csvFile.name}</p>
                {emailCount !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">
                      {emailCount} email address{emailCount !== 1 ? 'es' : ''} detected
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCsvFile(null);
                    setEmailCount(null);
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors mt-1"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-300">
                  Drop your CSV here, or <span className="text-violet-400 underline">browse</span>
                </p>
                <p className="text-xs text-gray-500">
                  One email per row, or comma-separated. Max 5MB.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scheduling Settings */}
        <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-4">
          <p className="text-sm font-medium text-gray-300">Scheduling Settings</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Start Time *</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/60 text-gray-100 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </div>
            <Input
              label="Delay Between Emails (ms)"
              type="number"
              min={500}
              value={form.delayBetweenEmailsMs}
              onChange={(e) =>
                setForm((f) => ({ ...f, delayBetweenEmailsMs: parseInt(e.target.value) }))
              }
              hint="Min 2000ms recommended"
            />
            <Input
              label="Hourly Limit (per sender)"
              type="number"
              min={1}
              max={1000}
              value={form.hourlyLimit}
              onChange={(e) =>
                setForm((f) => ({ ...f, hourlyLimit: parseInt(e.target.value) }))
              }
              hint="Max emails per hour per sender"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} id="schedule-submit-btn">
            {loading ? 'Scheduling...' : `Schedule${emailCount ? ` ${emailCount} Emails` : ''}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
