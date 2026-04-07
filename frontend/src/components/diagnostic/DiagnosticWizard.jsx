import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight, BrainCircuit, Sparkles, CheckCircle, XCircle, Compass, ShieldAlert, ChevronRight, Trophy, Target, Zap, Network } from 'lucide-react';
import client from '@/lib/apiClient';
import confetti from "canvas-confetti";

const markdownComponents = {
    p: ({ node, ...props }) => <p className="mb-6 last:mb-0 inline-block w-full" {...props} />,
    pre: ({ node, ...props }) => (
        <pre className="mt-8 mb-8 text-left bg-zinc-900 text-zinc-100 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-2xl text-sm md:text-base font-medium font-mono overflow-x-auto w-full max-w-full" {...props} />
    ),
    code(props) {
        const { children, className, node, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const isBlock = match || String(children).includes('\n');
        if (!isBlock) {
            return <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-lg break-words" {...rest}>{children}</code>;
        }
        return <code className="bg-transparent text-inherit p-0 font-mono" {...rest}>{children}</code>;
    }
};

const markdownOptionComponents = {
    p: ({ node, ...props }) => <p className="mb-0 inline-block w-full" {...props} />,
    pre: ({ node, ...props }) => (
        <pre className="mt-2 mb-2 text-left bg-zinc-900 text-zinc-100 border border-zinc-800 p-3 rounded-xl text-xs font-mono overflow-x-auto w-full max-w-full" {...props} />
    ),
    code(props) {
        const { children, className, node, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const isBlock = match || String(children).includes('\n');
        if (!isBlock) {
            return <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1 py-0.5 rounded text-xs" {...rest}>{children}</code>;
        }
        return <code className="bg-transparent text-inherit p-0 font-mono" {...rest}>{children}</code>;
    }
};

const DiagnosticWizard = ({ courseId, studentId, onComplete }) => {
  const [step, setStep] = useState('intro'); // 'intro', 'loading', 'quiz', 'review'
  const scrollRef = useRef(null);

  const [currentPhase, setCurrentPhase] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [hasNextPhase, setHasNextPhase] = useState(true);

  // Fake progress for loading screens
  const [loadingProgress, setLoadingProgress] = useState(0);

  const startFakeProgress = () => {
      setLoadingProgress(0);
      const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
              if (prev >= 98) return 98;
              return prev + Math.max(0.5, (98 - prev) * 0.08);
          });
      }, 500);
      return progressInterval;
  };

  const fetchNextPhase = async () => {
    setStep('loading');
    const interval = startFakeProgress();
    try {
      const res = await client.get(`/api/diagnostic/next-phase/${courseId}/${studentId}`);
      const data = res.data;

      clearInterval(interval);
      setLoadingProgress(100);

      // Slight delay for visual completion
      setTimeout(() => {
          if (!data.has_next_phase) {
            setHasNextPhase(false);
            setReviewSummary(null);
            if (currentPhase === 1) {
                // If the very first phase has nothing to unlock, just finish
                onComplete();
            } else {
                setStep('review'); 
            }
            return;
          }

          setQuestions(data.questions);
          setAnswers([]);
          setCurrentQuestionIndex(0);
          setSelectedOption(null);
          setSelectedOption(null);
          setStep('quiz');
      }, 400);

    } catch (err) {
      clearInterval(interval);
      console.error(err);
      alert("Failed to load diagnostic layer.");
      onComplete();
    }
  };

  const submitPhase = async (finalAnswers) => {
    setStep('loading');
    const interval = startFakeProgress();
    try {
      const res = await client.post(`/api/diagnostic/submit-phase`, {
        student_id: studentId,
        course_id: courseId,
        answers: finalAnswers
      });
      const data = res.data;

      clearInterval(interval);
      setLoadingProgress(100);

      setTimeout(() => {
          setReviewSummary(data.summary);
          if (data.has_next_phase !== undefined) {
              setHasNextPhase(data.has_next_phase);
          }
          setStep('review');
      }, 400);

    } catch (err) {
      clearInterval(interval);
      console.error(err);
      alert("Failed to submit diagnostic answers.");
      onComplete();
    }
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const currentQ = questions[currentQuestionIndex];
    
    const isCorrect = selectedOption === currentQ.correct_index;
    const newAnswers = [...answers, { skill_id: currentQ.skill_id, is_correct: isCorrect }];
    setAnswers(newAnswers);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      submitPhase(newAnswers);
    }
  };

  // ────── VIEWS ──────

  if (step === 'intro') {
      return (
          <div className="flex items-center justify-center w-full h-full bg-zinc-50 dark:bg-zinc-950 p-6">
              <Card className="max-w-xl w-full p-8 md:p-12 text-center border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-full flex items-center justify-center shadow-inner relative mb-4">
                      <Compass size={48} className="relative z-10" />
                  </div>
                  <div>
                      <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                          Find your starting point
                      </h2>
                      <p className="text-base font-medium text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed mb-8">
                          We will systematically evaluate your existing knowledge phase-by-phase so you can jump straight to learning!
                      </p>
                      
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-2 text-left space-y-5">
                          <div className="flex items-start gap-4">
                              <div className="mt-1 flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl">
                                  <Zap className="text-amber-500" size={20} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Save Time</h4>
                                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">We'll test you on foundational concepts first. If you know them, you'll instantly bypass them on your learning map.</p>
                              </div>
                          </div>
                          
                          <div className="flex items-start gap-4">
                              <div className="mt-1 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                                  <BrainCircuit className="text-blue-500" size={20} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Fast-Paced Phases</h4>
                                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">You'll answer 3 quick questions per topic. To keep things moving, you won't see immediate feedback until the phase ends.</p>
                              </div>
                          </div>
                          
                          <div className="flex items-start gap-4">
                              <div className="mt-1 flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl">
                                  <Network className="text-emerald-500" size={20} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Adaptive Path</h4>
                                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Passing a phase unlocks the next level of difficulty. The test ends naturally when you reach your learning frontier.</p>
                              </div>
                          </div>
                      </div>
                  </div>
                  <Button 
                      size="lg" 
                      onClick={fetchNextPhase}
                      className="h-14 w-full text-lg rounded-2xl px-8 shadow-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all font-bold group mt-2"
                  >
                      Begin Assessment <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
              </Card>
          </div>
      );
  }

  if (step === 'loading') {
      return (
          <div className="flex items-center justify-center w-full h-full bg-zinc-50 dark:bg-zinc-950 p-6">
              <Card className="max-w-md w-full p-8 md:p-10 text-center border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-3xl flex items-center justify-center animate-pulse shadow-inner relative">
                      <BrainCircuit size={40} className="relative z-10" />
                      <Loader2 className="absolute inset-0 m-auto text-blue-300 dark:text-blue-700 opacity-50 animate-spin" size={60} strokeWidth={2} />
                  </div>
                  <div>
                      <h2 className="text-xl md:text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-2">Analyzing Graph</h2>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Processing Diagnostic Phase {currentPhase}...</p>
                  </div>
                  <div className="w-full flex flex-col gap-2 mt-2">
                      <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Loading...</span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">{Math.floor(loadingProgress)}%</span>
                      </div>
                      <Progress value={loadingProgress} className="h-3 md:h-4 w-full bg-zinc-100 dark:bg-zinc-950 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500 rounded-full shadow-inner" />
                  </div>
              </Card>
          </div>
      );
  }

  if (step === 'review') {
      if (!hasNextPhase && !reviewSummary) {
          return (
              <div className="flex items-center justify-center w-full h-full p-8 bg-zinc-50 dark:bg-zinc-950">
                  <Card className="max-w-lg w-full p-10 text-center border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-950 shadow-2xl rounded-[2.5rem] animate-in zoom-in duration-500">
                      <div className="mx-auto w-24 h-24 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-8">
                          <CheckCircle size={48} />
                      </div>
                      <h2 className="text-4xl font-black mb-3 text-emerald-700 dark:text-emerald-400 tracking-tight">
                          Assessment Complete
                      </h2>
                      <p className="text-zinc-500 font-medium mb-10 leading-relaxed text-lg max-w-sm mx-auto">
                          We've mapped out your knowledge graph. You are totally ready to begin your personalized journey.
                      </p>
                      <Button className="w-full py-7 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl" onClick={onComplete}>
                          Enter Learning Path
                      </Button>
                  </Card>
              </div>
          );
      }

      if (!reviewSummary) return null;

      return (
          <div className="flex items-center justify-center w-full h-full p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
              <Card className="max-w-2xl w-full p-8 md:p-12 text-center border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl rounded-[2.5rem] animate-in fade-in slide-in-from-bottom-8 duration-500 my-auto">
                  <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-inner">
                      <Target size={40} />
                  </div>
                  
                  <h2 className="text-3xl font-black mb-2 text-zinc-900 dark:text-zinc-50 tracking-tight">
                      Phase {currentPhase} Summary
                  </h2>
                  <p className="text-zinc-500 font-medium mb-10 max-w-md mx-auto">
                      Results automatically applied to your graph.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 text-left mb-10">
                      <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex flex-col h-full">
                          <h4 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                              <CheckCircle size={14} /> Mastered
                          </h4>
                          {reviewSummary.passed.length > 0 ? (
                              <ul className="space-y-3 flex-grow mt-2">
                                  {reviewSummary.passed.map((s, i) => (
                                      <li key={i} className="text-emerald-900 dark:text-emerald-200 font-bold text-lg leading-tight flex items-center justify-between gap-2 bg-emerald-100/50 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                                          <div className="flex items-center gap-3">
                                              <CheckCircle size={18} className="text-emerald-500" /> 
                                              <span>{s.name || s}</span>
                                          </div>
                                          {(s.correct !== undefined && s.total !== undefined) && (
                                              <span className="text-sm font-black bg-emerald-200 dark:bg-emerald-800 px-2.5 py-1 rounded-lg text-emerald-800 dark:text-emerald-200 shadow-sm">
                                                  {s.correct}/{s.total}
                                              </span>
                                          )}
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <div className="flex flex-col items-center justify-center flex-grow opacity-70 mt-4 mb-4">
                                  <ShieldAlert size={36} className="text-emerald-600/50 dark:text-emerald-400/50 mb-3" />
                                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 text-center">No concepts fully mastered<br/>in this phase.</p>
                              </div>
                          )}
                      </div>
                      
                      <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 flex flex-col h-full">
                          <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                              <Sparkles size={14} /> Needs Review
                          </h4>
                          {reviewSummary.failed.length > 0 ? (
                              <ul className="space-y-3 flex-grow mt-2">
                                  {reviewSummary.failed.map((s, i) => (
                                      <li key={i} className="text-amber-900 dark:text-amber-200 font-bold text-lg leading-tight flex items-center justify-between gap-2 bg-amber-100/50 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                                          <div className="flex items-center gap-3">
                                              <XCircle size={18} className="text-amber-500" /> 
                                              <span>{s.name || s}</span>
                                          </div>
                                          {(s.correct !== undefined && s.total !== undefined) && (
                                              <span className="text-sm font-black bg-amber-200 dark:bg-amber-800 px-2.5 py-1 rounded-lg text-amber-800 dark:text-amber-200 shadow-sm">
                                                  {s.correct}/{s.total}
                                              </span>
                                          )}
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <div className="flex flex-col items-center justify-center flex-grow opacity-70 mt-4 mb-4">
                                  <Trophy size={36} className="text-amber-600/50 dark:text-amber-400/50 mb-3" />
                                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300 text-center">Perfect phase!<br/>All topics cleared.</p>
                              </div>
                          )}
                      </div>
                  </div>
                  
                  {reviewSummary.newly_unlocked_count > 0 && (
                      <div className="mb-10 p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                              🎉 Mastery in this phase just unlocked <span className="text-blue-600 dark:text-blue-400 font-black">{reviewSummary.newly_unlocked_count} new concepts</span>!
                          </p>
                      </div>
                  )}

                  <div className="flex flex-col gap-3">
                      {hasNextPhase ? (
                          <>
                              <Button 
                                  className="w-full py-7 text-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-2xl shadow-xl transition-all"
                                  onClick={() => {
                                      setCurrentPhase(prev => prev + 1);
                                      fetchNextPhase();
                                  }}
                              >
                                  Engage Phase {currentPhase + 1} <ChevronRight className="ml-2" />
                              </Button>
                              <Button variant="ghost" className="w-full py-6 text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-colors" onClick={() => {
                                  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                                  setTimeout(onComplete, 1200);
                              }}>
                                  Stop Testing & Enter Course
                              </Button>
                          </>
                      ) : (
                          <Button className="w-full py-7 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl" onClick={() => {
                              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                              setTimeout(onComplete, 1200);
                          }}>
                              Enter Learning Path <Trophy className="ml-2" size={20} />
                          </Button>
                      )}
                  </div>
              </Card>
          </div>
      );
  }

  if (step === 'quiz') {
      const currentQ = questions[currentQuestionIndex];
      const totalQuestions = questions.length;
      const progressPercent = totalQuestions > 0 ? Math.round(((currentQuestionIndex) / totalQuestions) * 100) : 0;
      const liveScore = answers.filter(a => a.is_correct).length;

      return (
          <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden w-full">
              {/* Header Fixed Area */}
              <div className="flex-shrink-0 px-4 pt-4 md:px-8 md:pt-8 bg-zinc-50 dark:bg-zinc-950 z-10 w-full max-w-7xl mx-auto">
                  <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:p-6 gap-5 md:gap-6 border-zinc-200/60 dark:border-zinc-800 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 backdrop-blur-md shadow-sm border-none">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                              <BrainCircuit size={24} className="md:w-7 md:h-7" />
                          </div>
                          <div>
                              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Diagnostic Phase {currentPhase}</h1>
                              <p className="text-xs md:text-base font-medium text-blue-600/80 mt-0.5 flex items-center gap-2">
                                  <Sparkles size={14} className="md:w-4 md:h-4" /> Question {currentQuestionIndex + 1} of {totalQuestions}
                              </p>
                          </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[240px]">
                          <div className="flex items-center justify-between text-xs md:text-sm font-bold bg-white/50 dark:bg-zinc-900/50 p-2 md:p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <div className="flex flex-col items-center flex-1">
                                  <span className="text-[9px] uppercase tracking-widest text-zinc-400">Live Score</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 text-sm md:text-base">{liveScore}</span>
                              </div>
                              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>
                              <div className="flex flex-col items-center flex-1">
                                  <span className="text-[9px] uppercase tracking-widest text-zinc-400">Total Progress</span>
                                  <span className="text-zinc-600 dark:text-zinc-300 text-sm md:text-base">{progressPercent}%</span>
                              </div>
                          </div>
                          <Progress value={progressPercent} className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 [&>div]:bg-blue-500 rounded-full" />
                      </div>
                  </Card>
              </div>

              {/* Main Scrollable Content Area */}
              <div ref={scrollRef} className="flex-grow overflow-y-auto flex flex-col items-center px-4 md:px-8 pb-32">
                  <div className="w-full max-w-4xl mx-auto flex flex-col flex-grow justify-center py-8 md:py-12 gap-8 md:gap-12">
                      
                      {/* The Question Area */}
                      <div className="w-full flex flex-col items-center text-center gap-4">
                          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                              <ShieldAlert size={20} />
                              <span className="text-sm font-bold tracking-widest uppercase">Question {currentQuestionIndex + 1}</span>
                          </div>
                          <div className="w-full text-zinc-800 dark:text-zinc-100 max-w-3xl text-xl md:text-3xl font-extrabold leading-snug md:leading-tight text-left md:text-center mx-auto animate-in fade-in duration-500 whitespace-pre-wrap">
                              <Markdown components={markdownComponents}>
                                  {currentQ.question}
                              </Markdown>
                          </div>
                      </div>

                      {/* The Feedback/Explanation Area (Middle) Removed */}

                      {/* The Options Area (2x2 Grid) */}
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                          {currentQ.options.map((option, idx) => {
                              const isSelected = selectedOption === idx;
                              const optionId = String.fromCharCode(65 + idx);
                              
                              let style = "py-6 md:py-8 text-lg justify-start px-6 font-bold border-2 transition-all text-left whitespace-normal h-auto rounded-3xl min-h-[100px]";

                              if (isSelected) style += " border-blue-500 bg-blue-50/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-[0_0_0_4px_rgba(59,130,246,0.1)] scale-[1.02] z-10";
                              else style += " border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:scale-[1.01]";

                              return (
                                  <Button
                                      key={idx}
                                      variant="outline"
                                      className={style}
                                      onClick={() => setSelectedOption(idx)}
                                  >
                                      <span className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl mr-4 md:mr-5 text-sm md:text-base font-black tracking-wider uppercase flex-shrink-0 transition-colors
                                          ${isSelected ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200" :
                                                      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                          }`}>
                                          {optionId}
                                      </span>
                                      <span className="leading-snug whitespace-pre-wrap text-left flex-1">
                                          <Markdown components={markdownOptionComponents}>{option}</Markdown>
                                      </span>
                                  </Button>
                              );
                          })}
                      </div>
                  </div>
              </div>

              {/* Bottom Anchored Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                  <div className="w-full max-w-4xl mx-auto flex justify-end">
                      <Button 
                          size="lg" 
                          className={`w-full md:w-auto md:min-w-[320px] h-14 md:h-16 text-xl font-black rounded-2xl transition-all shadow-xl ${
                              selectedOption !== null
                                  ? "bg-zinc-900 text-white hover:bg-zinc-800 hover:-translate-y-1 hover:shadow-2xl dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:hover:shadow-white/20" 
                                  : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed border-none shadow-none"
                          }`} 
                          onClick={handleNext} 
                          disabled={selectedOption === null}
                      >
                          {currentQuestionIndex < totalQuestions - 1 ? (
                              <>Next Question <ChevronRight className="ml-2" size={24} /></>
                          ) : (
                              <>Complete Phase {currentPhase} <CheckCircle className="ml-2" size={24} /></>
                          )}
                      </Button>
                  </div>
              </div>
          </div>
      );
  }

  return null;
};

export default DiagnosticWizard;
