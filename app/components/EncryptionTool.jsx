"use client";

import React, { useState, useRef } from 'react';
import { Lock, Unlock, Upload, FileText, Download, ShieldCheck, AlertTriangle, RefreshCw, Github } from 'lucide-react';

export default function EncryptionTool() {
  const [file, setFile] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [mode, setMode] = useState(null); // 'encrypt' or 'decrypt'
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef(null);

  // --- Core Encryption Logic (Ported from Java) ---

  // Replicates the Java enterKey() logic: Sum of digits
  const calculateKey = (inputStr) => {
    const cleanInput = inputStr.replace(/[^0-9]/g, '');
    if (!cleanInput) return 0;
    
    let num = parseInt(cleanInput, 10);
    let sum = 0;
    
    const digits = num.toString().split('').map(Number);
    digits.forEach(d => sum += d);
    
    return sum;
  };

  const processFile = async (selectedMode) => {
    if (!file) {
      addLog("Error: No file selected.", "error");
      return;
    }
    if (!keyInput) {
      addLog("Error: No key entered.", "error");
      return;
    }

    const calculatedKey = calculateKey(keyInput);
    
    if (calculatedKey === 0) {
      addLog("Error: Key must result in a non-zero value.", "error");
      return;
    }

    setMode(selectedMode);
    setStatus('processing');
    addLog(`Starting ${selectedMode}ion...`, "info");
    addLog(`Key derivation: Input '${keyInput}' -> Shift '${calculatedKey}'`, "info");

    try {
      // 1. Read File
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const outputBytes = new Uint8Array(bytes.length);

      // 2. Determine Shift
      // Encrypt uses -key, Decrypt uses +key (inverse of original Java logic for better compatibility)
      // Java Logic Port:
      // Encrypt uses convert(-key) -> byte + (-key)
      // Decrypt uses convert(key)  -> byte + key
      const shift = selectedMode === 'encrypt' ? -calculatedKey : calculatedKey;

      // 3. Process Bytes
      for (let i = 0; i < bytes.length; i++) {
        outputBytes[i] = (bytes[i] + shift) & 0xFF;
      }

      // 4. Download Result
      const blob = new Blob([outputBytes], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let newName = file.name;
      if (selectedMode === 'encrypt') {
        newName = `${file.name}.enc`;
      } else if (selectedMode === 'decrypt' && file.name.endsWith('.enc')) {
        newName = file.name.slice(0, -4);
      } else if (selectedMode === 'decrypt') {
        newName = `decrypted_${file.name}`;
      }

      link.download = newName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('success');
      addLog(`Success: ${newName} downloaded.`, "success");

    } catch (err) {
      console.error(err);
      setStatus('error');
      addLog(`Critical Error: ${err.message}`, "error");
    }
  };

  // --- UI Helper Functions ---

  const addLog = (msg, type) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${msg}`, ...prev]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      addLog(`File loaded: ${e.dataTransfer.files[0].name}`, "info");
      setStatus('idle');
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      addLog(`File loaded: ${e.target.files[0].name}`, "info");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-xl tracking-tight text-white">Cryptify<span className="text-indigo-500">Web</span></span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className="hidden sm:block">Secure Client-Side Encryption</span>
            <div className="hover:text-white transition-colors"><Github className="w-5 h-5"/></div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-7 space-y-8">
            
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Protect your data.</h1>
              <p className="text-slate-400 text-lg">
                Upload any file to encrypt it securely in your browser. No data is ever sent to a server.
              </p>
            </div>

            {/* 1. File Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center cursor-pointer group
                ${file ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-full ${file ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'} transition-colors`}>
                  {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-lg text-white">
                    {file ? file.name : "Click or drag file here"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {file ? `${(file.size / 1024).toFixed(2)} KB` : "Support for .txt, .java, .png, and more"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Key Input */}
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm">
              <label className="block text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Security Key</label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="Enter a numeric secret (e.g. 1234)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                />
                <div className="absolute right-4 top-3 text-slate-600">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Tip: The encryption shift is calculated from the sum of these digits.
              </p>
            </div>

            {/* 3. Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => processFile('encrypt')}
                disabled={status === 'processing' || !file || !keyInput}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-rose-900/20 active:scale-95"
              >
                {status === 'processing' && mode === 'encrypt' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Lock className="w-5 h-5" />}
                Encrypt
              </button>
              
              <button
                onClick={() => processFile('decrypt')}
                disabled={status === 'processing' || !file || !keyInput}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                {status === 'processing' && mode === 'decrypt' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Unlock className="w-5 h-5" />}
                Decrypt
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Terminal/Logs */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-[400px]">
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-full shadow-2xl">
              {/* Terminal Header */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 uppercase">System Activity Log</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                </div>
              </div>

              {/* Log Output */}
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-2 max-h-[500px]">
                {logs.length === 0 && (
                  <div className="text-slate-600 italic">Waiting for input...</div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className={`
                    ${log.includes("Error") ? "text-rose-400" : ""}
                    ${log.includes("Success") ? "text-emerald-400" : ""}
                    ${!log.includes("Error") && !log.includes("Success") ? "text-slate-300" : ""}
                  `}>
                    <span className="opacity-50 mr-2">&gt;</span>{log}
                  </div>
                ))}
              </div>

              {/* Status Footer */}
              <div className={`p-3 text-xs font-semibold text-center uppercase tracking-wider
                ${status === 'idle' ? 'bg-slate-800 text-slate-400' : ''}
                ${status === 'processing' ? 'bg-indigo-900/50 text-indigo-300 animate-pulse' : ''}
                ${status === 'success' ? 'bg-emerald-900/30 text-emerald-400' : ''}
                ${status === 'error' ? 'bg-rose-900/30 text-rose-400' : ''}
              `}>
                STATUS: {status.toUpperCase()}
              </div>
            </div>
            
            {/* Tech Stack Badge */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
               <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">Next.js 14</span>
               <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">Tailwind CSS</span>
               <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">Web Crypto</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}