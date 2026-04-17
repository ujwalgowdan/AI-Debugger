import { useState, useRef } from "react";
import LanguageSelector from "./components/LanguageSelector.jsx";
import DebugResult from "./components/DebugResult.jsx";

const EXAMPLE_CODES = {
  javascript: `function fetchUser(userId) {
  const user = db.find(userId)
  if (user = null) {
    return "User not found"
  }
  const age = user.birthday - Date.now()
  return {
    name: user.Name,
    age: age,
    password: user.password
  }
}

// Memory leak - event listener never removed
document.addEventListener('click', () => {
  fetchUser(currentUserId)
})`,
  python: `def calculate_average(numbers):
    total = 0
    for i in range(len(numbers)):
        total = total + numbers[i]
    average = total / len(numbers)
    return average

result = calculate_average([])
print(f"Average: {result}")

# SQL injection vulnerability
def get_user(username):
    query = "SELECT * FROM users WHERE name = '" + username + "'"
    return db.execute(query)`,
  java: `public class Calculator {
    public int divide(int a, int b) {
        return a / b;
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator();
        int result = calc.divide(10, 0);
        System.out.println(result);

        String str = null;
        System.out.println(str.length());
    }
}`,
};

export default function App() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamText, setStreamText] = useState("");
  const abortRef = useRef(null);

  const debugCode = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setStreamText("");

    try {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Server error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.chunk) {
              fullText += data.chunk;
              setStreamText(fullText);
            }
            if (data.done) {
              const jsonMatch = data.full.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setResult(parsed);
                setStreamText("");
              } else {
                throw new Error("Could not parse response as JSON");
              }
            }
          } catch (e) {
            if (e.message !== "Could not parse response as JSON") {
              setError(e.message);
            }
          }
        }
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    const example = EXAMPLE_CODES[language] || EXAMPLE_CODES.javascript;
    setCode(example);
    setResult(null);
    setError(null);
    setStreamText("");
  };

  const clearAll = () => {
    setCode("");
    setResult(null);
    setError(null);
    setStreamText("");
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              🐛
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-100">AI Code Debugger</h1>
              <p className="text-xs text-gray-500">Powered by Claude Opus</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-gray-400">Ready</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Code Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-300">Your Code</h2>
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadExample}
                  className="text-xs px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 transition-colors"
                >
                  Load Example
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your ${language} code here...\n\nThe AI will analyze it for:\n• Bugs and errors\n• Security vulnerabilities\n• Performance issues\n• Logic problems`}
                className="w-full h-96 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none scrollbar-thin leading-relaxed"
                spellCheck={false}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-600">
                {code.length} chars · {code.split("\n").length} lines
              </div>
            </div>

            <button
              onClick={debugCode}
              disabled={loading || !code.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                bg-violet-600 hover:bg-violet-500 active:scale-[0.99] text-white shadow-lg shadow-violet-900/30
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Debug My Code
                </>
              )}
            </button>
          </div>

          {/* Right — Results */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-300">Analysis Results</h2>

            {!loading && !result && !error && !streamText && (
              <div className="h-96 flex flex-col items-center justify-center bg-gray-900/40 border border-dashed border-gray-700 rounded-xl text-center px-6">
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-gray-500 text-sm">
                  Paste your code and click <span className="text-violet-400">Debug My Code</span>
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  Claude will identify bugs, explain issues, and suggest fixes
                </p>
              </div>
            )}

            {loading && streamText && (
              <div className="bg-gray-900 border border-violet-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-violet-400">Claude is analyzing your code...</span>
                </div>
                <pre className="text-xs text-gray-400 max-h-80 overflow-auto scrollbar-thin whitespace-pre-wrap opacity-60">
                  {streamText.slice(-600)}
                </pre>
              </div>
            )}

            {loading && !streamText && (
              <div className="h-32 flex items-center justify-center bg-gray-900/40 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-violet-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-gray-400">Connecting to Claude...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-400">⚠</span>
                  <span className="text-sm font-medium text-red-300">Error</span>
                </div>
                <p className="text-sm text-red-400">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Check that your ANTHROPIC_API_KEY is set in server/.env
                </p>
              </div>
            )}

            {result && <DebugResult result={result} />}
          </div>
        </div>
      </main>
    </div>
  );
}
