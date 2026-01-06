'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft, Send, CheckCircle2, Upload, X, FileText, ChevronDown, Star } from 'lucide-react';
import api, { generateUploadHeaders } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import clsx from 'clsx';

interface Question {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
}

interface FormDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  require_login: boolean;
  schema: Question[] | string;
}

const FormDetailClient = ({ id }: { id: string | number }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleFileUpload = async (questionId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('文件大小不能超过 10MB', 'error');
      return;
    }

    setUploading(prev => ({ ...prev, [questionId]: true }));
    try {
      const headers = await generateUploadHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'form_attachment');

      const res = await api.post('/api/upload/image', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      handleInputChange(questionId, res.data.url);
      showToast('文件上传成功', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || '文件上传失败', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  useEffect(() => {
    api.get<FormDetail>(`/api/forms/${id}`)
      .then(res => {
        const formData = res.data;
        // Parse schema if string
        if (typeof formData.schema === 'string') {
          try {
            formData.schema = JSON.parse(formData.schema);
          } catch (e) {
            console.error("Schema parse error", e);
            formData.schema = [];
          }
        }
        setForm(formData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.status === 401 ? '需要登录才能查看' : '无法加载问卷或问卷不存在');
        setLoading(false);
      });
  }, [id]);

  const handleInputChange = (qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    if (!form) return;

    // Validation
    const questions = form.schema as Question[];
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') {
          showToast(`请填写: ${q.label}`, 'error');
          return;
        }
        if (Array.isArray(val) && val.length === 0) {
           showToast(`请填写: ${q.label}`, 'error');
           return;
        }
      }
    }

    if (form.require_login && !user) {
      showToast('请先登录', 'error');
      router.push('/login?redirect=/forms/' + id);
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/forms/${id}/submit`, { data: answers });
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || '提交失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-panel p-8 rounded-2xl text-center relative z-10 border border-white/20 shadow-xl"
        >
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">访问受限</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            返回首页
          </button>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-emerald-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">提交成功</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">感谢您的参与，我们会认真阅读您的反馈。</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const rawQuestions = (Array.isArray(form?.schema) ? form.schema : []) as Question[];
  
  let qCount = 0;
  const questions = rawQuestions.map(q => {
    if (q.type === 'section') {
      return { ...q, displayIndex: null };
    }
    qCount++;
    return { ...q, displayIndex: qCount < 10 ? `0${qCount}` : `${qCount}` };
  });

  return (
    <div className="min-h-screen relative">
      {/* Background Cover */}
      {form?.cover_image && (
        <div className="absolute top-0 left-0 w-full h-[400px] z-0">
          <img 
            src={form.cover_image} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-60 dark:opacity-40"
          />
        </div>
      )}

      <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/5"
          >
            {/* Header */}
            <div className="p-8 md:p-12 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-4">
                <span className={clsx(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  form?.status === 'published' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700"
                )}>
                  {form?.status === 'published' ? '进行中' : '已结束'}
                </span>
                {form?.require_login && (
                   <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                     需登录
                   </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                {form?.title}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {form?.description}
              </p>
            </div>

            {/* Form Body */}
            <div className="p-8 md:p-12 space-y-10">
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-4 group">
                  {q.type === 'section' ? (
                     <div className="pt-8 pb-2 border-b-2 border-slate-100 dark:border-slate-800">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{q.label}</h3>
                        {q.description && <p className="text-slate-500 mt-2">{q.description}</p>}
                     </div>
                  ) : (
                    <>
                      <label className="block text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <span className="text-slate-400 mr-2 font-normal text-base">{q.displayIndex}</span>
                        {q.label}
                        {q.required && <span className="text-red-500 ml-1" title="必填">*</span>}
                      </label>
                    
                      {/* Text Input */}
                      {q.type === 'text' && (
                        <input 
                          type="text"
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400"
                          placeholder={q.placeholder || '请输入...'}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      )}

                      {/* Number Input */}
                      {q.type === 'number' && (
                        <input 
                          type="number"
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400"
                          placeholder={q.placeholder || '请输入数字...'}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      )}

                      {/* Email Input */}
                      {q.type === 'email' && (
                        <input 
                          type="email"
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400"
                          placeholder={q.placeholder || 'example@email.com'}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      )}

                      {/* Textarea */}
                      {q.type === 'textarea' && (
                        <textarea 
                          rows={4}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 resize-y"
                          placeholder={q.placeholder || '请输入...'}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      )}

                      {/* Switch */}
                      {q.type === 'switch' && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleInputChange(q.id, !answers[q.id])}
                            className={clsx(
                              "w-14 h-8 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500",
                              answers[q.id] ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                            )}
                          >
                            <div className={clsx(
                              "absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform",
                              answers[q.id] ? "translate-x-6" : "translate-x-0"
                            )} />
                          </button>
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            {answers[q.id] ? '是' : '否'}
                          </span>
                        </div>
                      )}

                      {/* Rating */}
                      {q.type === 'rating' && (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button" // Prevent form submission
                              onClick={() => handleInputChange(q.id, star)}
                              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                            >
                              <Star 
                                size={36} 
                                className={clsx(
                                  "transition-all",
                                  (answers[q.id] || 0) >= star 
                                    ? "fill-amber-400 text-amber-400" 
                                    : "text-slate-200 dark:text-slate-700 hover:text-amber-200"
                                )} 
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Range / Slider */}
                      {q.type === 'range' && (
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="1"
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            value={answers[q.id] || 0}
                            onChange={(e) => handleInputChange(q.id, Number(e.target.value))}
                          />
                          <span className="text-slate-600 dark:text-slate-400 font-mono font-medium min-w-[3ch] text-right">
                            {answers[q.id] || 0}
                          </span>
                        </div>
                      )}

                      {/* Time */}
                      {q.type === 'time' && (
                        <input 
                          type="time"
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      )}

                      {/* Radio */}
                      {q.type === 'radio' && (
                        <div className="space-y-3">
                          {q.options?.map((opt, i) => (
                            <label key={i} className={clsx(
                              "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group/opt",
                              answers[q.id] === opt.value 
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-500/50" 
                                : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}>
                              <div className="relative flex items-center justify-center">
                                <input 
                                  type="radio" 
                                  name={q.id}
                                  value={opt.value}
                                  checked={answers[q.id] === opt.value}
                                  onChange={(e) => handleInputChange(q.id, e.target.value)}
                                  className="peer appearance-none w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 checked:border-emerald-500 transition-colors"
                                />
                                <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-transform" />
                              </div>
                              <span className="text-slate-700 dark:text-slate-200 font-medium">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Checkbox */}
                      {q.type === 'checkbox' && (
                        <div className="space-y-3">
                          {q.options?.map((opt, i) => {
                            const isChecked = (answers[q.id] || []).includes(opt.value);
                            return (
                              <label key={i} className={clsx(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group/opt",
                                isChecked
                                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-500/50" 
                                  : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              )}>
                                <div className="relative flex items-center justify-center">
                                  <input 
                                    type="checkbox"
                                    value={opt.value}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const current = answers[q.id] || [];
                                      const newValue = e.target.checked
                                        ? [...current, opt.value]
                                        : current.filter((v: string) => v !== opt.value);
                                      handleInputChange(q.id, newValue);
                                    }}
                                    className="peer appearance-none w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 checked:border-emerald-500 checked:bg-emerald-500 transition-all"
                                  />
                                  <CheckCircle2 className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                </div>
                                <span className="text-slate-700 dark:text-slate-200 font-medium">{opt.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Select */}
                      {q.type === 'select' && (
                        <div className="relative">
                            <select
                              value={answers[q.id] || ''}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none transition-all cursor-pointer"
                            >
                              <option value="" disabled>请选择...</option>
                              {q.options?.map((opt, i) => (
                                <option key={i} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                              <ChevronDown size={20} />
                            </div>
                        </div>
                      )}
                      
                      {/* Date */}
                      {q.type === 'date' && (
                        <input 
                          type="date"
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                        />
                      )}

                      {/* File Upload */}
                      {q.type === 'file' && (
                        <div className="space-y-2">
                          {answers[q.id] ? (
                              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  <FileText className="text-emerald-500" />
                                  <a href={answers[q.id]} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm text-blue-500 hover:underline">
                                      {answers[q.id].split('/').pop()}
                                  </a>
                                  <button 
                                      onClick={() => handleInputChange(q.id, '')}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"
                                  >
                                      <X size={16} />
                                  </button>
                              </div>
                          ) : (
                              <div className="relative">
                                  <input 
                                      type="file"
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                              handleFileUpload(q.id, e.target.files[0]);
                                          }
                                      }}
                                  />
                                  <div className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-emerald-500 transition-colors text-slate-500 dark:text-slate-400">
                                      {uploading[q.id] ? (
                                          <>
                                              <Loader2 className="animate-spin" /> 上传中...
                                          </>
                                      ) : (
                                          <>
                                              <Upload size={20} /> 点击上传文件 (Max 10MB)
                                          </>
                                      )}
                                  </div>
                              </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
             <button
               onClick={handleSubmit}
               disabled={submitting}
               className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {submitting ? (
                 <>
                   <Loader2 className="animate-spin" /> 提交中...
                 </>
               ) : (
                 <>
                   提交问卷 <Send size={20} />
                 </>
               )}
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
  );
};

export default FormDetailClient;
