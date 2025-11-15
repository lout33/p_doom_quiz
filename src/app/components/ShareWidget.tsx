'use client';

import { useState } from 'react';

interface ShareWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareWidget({ isOpen, onClose }: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);

  // Production URL
  const deploymentUrl = 'https://p-doom-quiz.vercel.app';

  const embedCode = `<div style="max-width:960px;margin:0 auto;">
  <iframe
    src="${deploymentUrl}"
    title="P(doom) Calculator"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    allowtransparency="true"
    style="width:100%;min-height:760px;border:1px solid rgba(120,186,255,0.35);background:#0b1120;"
  ></iframe>
</div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-900/50">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Shareable Widget</h2>
            <p className="text-gray-400 mt-1">Embed the P(doom) calculator on your site</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Drop the snippet below anywhere on your page (blog post, documentation, or landing page) to provide
              direct access to the calculator within an iframe.
            </p>
          </div>

          {/* Copy & Paste Snippet */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-100">Copy & paste snippet</h3>
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-700 hover:bg-blue-600 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 -mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 -mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy snippet
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono">
                <code>{embedCode}</code>
              </pre>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-100 mb-3">Live preview</h3>
            <p className="text-sm text-gray-400 mb-4">
              This is exactly what the embed looks like with the recommended wrapper class applied.
            </p>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div style={{maxWidth: '960px', margin: '0 auto'}}>
                <iframe
                  src={deploymentUrl}
                  title="P(doom) Calculator"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    border: '1px solid rgba(120,186,255,0.35)',
                    background: '#0b1120',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-900/20 border border-blue-900/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Place the snippet inside a container that has enough vertical space (the calculator is roughly 740px tall at desktop widths).</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>You can override the default height by adding a custom class and setting <code className="bg-gray-800 px-2 py-1 rounded text-green-400">min-height</code> on the iframe.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>For dark pages, keep the surrounding container dark so the calculator styling blends seamlessly.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>If you use a Content Security Policy, allow <code className="bg-gray-800 px-2 py-1 rounded text-green-400">{deploymentUrl}</code> for <code className="bg-gray-800 px-2 py-1 rounded text-green-400">frame-src</code>.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
