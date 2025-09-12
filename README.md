# 🎓 Coursera Tool - Open Source Coursera Automation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Privacy: No Tracking](https://img.shields.io/badge/Privacy-No%20Tracking-green.svg)](#privacy--security)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-blue.svg)](#open-source)

A **completely open-source, privacy-focused** browser extension that automates Coursera course completion. Originally designed for FPTU courses, now supports all Coursera courses with **zero tracking** and **no data collection**.

## 🌟 Why Choose Our Extension?

### ✅ **100% Open Source & Transparent**
- **Full source code available** - inspect every line of code
- **No hidden functionality** - what you see is what you get
- **Community-driven** - contributions welcome from everyone
- **MIT Licensed** - free to use, modify, and distribute

### 🔒 **Privacy-First Design**
- **🚫 Zero tracking** - we don't monitor your activity
- **🚫 No data collection** - your information stays private
- **🚫 No telemetry** - no usage statistics sent anywhere
- **🚫 No third-party analytics** - completely clean codebase

### 🚀 **Bloat-Free Performance**
- **Lightweight** - minimal resource usage
- **Fast execution** - optimized for performance
- **Clean interface** - intuitive and user-friendly
- **Efficient automation** - gets the job done quickly

## 🎯 Key Features

### 🤖 **Intelligent Automation**
- **Auto-skip videos and readings** - bypass time-consuming content
- **Smart quiz completion** - multiple answer sources for accuracy
- **Assignment auto-grading** - automated submission and grading
- **Peer review automation** - handle peer assessments efficiently
- **Discussion participation** - automatic forum engagement
- **Week completion** - full course progression automation

### 🧠 **Multiple Answer Sources**
- **Gemini AI Integration** - advanced AI-powered answer generation
- **FPT Source Database** - community-maintained answer repository
- **GitHub Pages Integration** - access to `pear104.github.io` databases
- **Intelligent fallback** - automatically switches between sources
- **Offline capability** - works with cached data when available

### 🛠️ **Advanced Configuration**
- **Flexible source selection** - choose between AI and database answers
- **Customizable timing** - adjust automation speed and delays
- **Debug mode** - detailed logging for troubleshooting
- **Auto-submit options** - control automatic submission behavior
- **Error recovery** - graceful handling of unexpected situations

## 📦 Installation

### Method 1: Load Unpacked Extension (Recommended)

1. **Download the extension**:
   ```bash
   git clone https://github.com/ruskicoder/coursera-tool-fbt.git
   cd coursera-tool-fbt
   ```

2. **Choose your version**:
   - `1.0.5.10-clean/` - **Latest with FPT source enabled** (Recommended)
   - `1.0.5.9/` - Stable version without FPT source
   - `1.0.5.4/` - Original cleaned version

3. **Load in Chrome/Edge**:
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the version folder (e.g., `coursera-tool/cpebdnelbbfbnjbdafkkcgbbgbdbhhgb/1.0.5.10-clean/`)

4. **Verify installation**:
   - Extension icon should appear in your browser toolbar
   - Visit any Coursera course to see the automation interface

### Method 2: Manual Installation

1. Download the ZIP file from the repository
2. Extract to a local folder
3. Follow steps 2-4 from Method 1

## 🚀 Quick Start Guide

### 1. **Choose Your Answer Source**

**Option A: Gemini AI (Requires API Key)**
```javascript
// Get your free Gemini API key from:
// https://makersuite.google.com/app/apikey
```
- Provides AI-generated answers
- Requires internet connection
- Generally high accuracy
- May have rate limits

**Option B: FPT Source (No Setup Required)**
- Uses community-maintained database
- Works offline with cached data
- Instant responses
- No API key needed

### 2. **Navigate to Your Course**
- Open any Coursera course
- The extension automatically detects course content
- Automation interface appears when applicable

### 3. **Start Automation**
- Select your preferred answer source
- Choose automation type (quiz, assignment, etc.)
- Click "Start" and let the magic happen!

## 🔧 Configuration

### Extension Settings
```javascript
{
  "method": "gemini",              // or "source" for FPT
  "isAutoSubmitQuiz": false,       // Auto-submit completed quizzes
  "isDebugMode": false,            // Enable detailed logging
  "discussionWaitingTime": 12,     // Delay between forum posts (seconds)
  "geminiAPI": "your-api-key-here" // Your Gemini API key
}
```

### Advanced Options
- **Custom timing**: Adjust delays to avoid detection
- **Selective automation**: Choose which components to automate
- **Error handling**: Configure retry attempts and fallback behavior

## 📚 Supported Content Types

| Content Type | Status | Description |
|-------------|--------|-------------|
| 📹 **Video Lectures** | ✅ Full Support | Auto-skip with progress tracking |
| 📖 **Reading Materials** | ✅ Full Support | Instant completion marking |
| ❓ **Quizzes** | ✅ Full Support | Multi-source answer retrieval |
| 📝 **Assignments** | ✅ Full Support | Auto-grading and submission |
| 👥 **Peer Reviews** | ✅ Full Support | Automated peer assessments |
| 💬 **Discussions** | ✅ Full Support | Forum participation automation |
| 🏆 **Final Exams** | ✅ Full Support | Comprehensive exam automation |
| 📊 **Graded Projects** | ✅ Full Support | Project submission automation |

## 🛡️ Privacy & Security

### Our Privacy Commitment
- **🔒 No tracking cookies** - we don't store any tracking data
- **🔒 No user profiling** - we don't build profiles or analyze behavior  
- **🔒 No data transmission** - your course data stays on your device
- **🔒 No third-party services** - except chosen answer sources (Gemini/FPT)
- **🔒 Open source verification** - audit our code anytime

### What Data We DON'T Collect
- ❌ Personal information (name, email, student ID)
- ❌ Course progress or grades
- ❌ Quiz answers or submissions
- ❌ Browsing history or behavior
- ❌ Device information or IP addresses
- ❌ Usage analytics or telemetry

### What Happens to Your Data
- **Quiz content**: Only sent to your chosen answer source (Gemini AI or FPT database)
- **Local storage**: Extension settings stored locally in your browser
- **No cloud storage**: Nothing is stored on external servers
- **Your control**: You can clear all data by removing the extension


### ⚠️ **Disclaimers**
- This tool is for **educational assistance only**
- Users are **responsible** for ensuring compliance with their institution's policies
- **Academic integrity** is the user's responsibility
- We **do not encourage** academic dishonesty or policy violations

## 📋 Changelog

### Version 1.0.5.10 (Latest) - September 13, 2025
**🎉 Major Update: FPT Source Enabled**
- ✅ **Unlocked FPT source functionality** - access to community answer databases
- ✅ **GitHub Pages integration** - direct access to pear104.github.io databases
- ✅ **No server restrictions** - removed permission checks for FPT access
- ✅ **Enhanced answer sources** - choice between AI and community databases
- ✅ **Improved reliability** - better fallback handling between sources

### Version 1.0.5.9 - Bloat removal
**🧹 Mellowtel Cleanup**
- ✅ **Complete Mellowtel removal** - all tracking components eliminated
- ✅ **Privacy improvements** - zero data collection implementation
- ✅ **Performance optimization** - removed unnecessary background processes
- ✅ **Security hardening** - eliminated external tracking connections

### Version 1.0.5.5 - Initial Clean Release
**🚀 First Clean Version**
- ✅ **Mellowtel tracking removed** - initial privacy-focused release
- ✅ **Core automation preserved** - all Coursera features maintained
- ✅ **Stability improvements** - enhanced error handling and recovery
- ✅ **Open source preparation** - code cleanup and documentation

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 **Bug Reports**
- Use the [GitHub Issues](https://github.com/ruskicoder/coursera-tool-fbt/issues) page
- Provide detailed steps to reproduce
- Include browser version and extension version
- Share relevant error messages or logs

### 💡 **Feature Requests**
- Suggest new automation features
- Propose UI/UX improvements
- Request support for new content types
- Share ideas for better privacy protection

## 🆘 Support & Troubleshooting

### Common Issues

**🔧 Extension Not Loading**
```bash
# Check browser console for errors
# Ensure Developer Mode is enabled
# Try reloading the extension
```

**❓ Answers Not Found**
```bash
# Try switching between Gemini and FPT sources
# Check internet connection for Gemini API
# Verify API key is correctly configured
```

**⚠️ Quiz Not Auto-Submitting**
```bash
# Check "Auto Submit Quiz" setting
# Ensure quiz is fully completed
# Try manual submission if needed
```

### Getting Help
- 📧 **GitHub Issues**: [Create an issue](https://github.com/ruskicoder/coursera-tool-fbt/issues)
- 💬 **Discussions**: Share tips and tricks with the community
- 📚 **Documentation**: Check this README for detailed information
- 🔍 **Debug Mode**: Enable for detailed error logging

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What This Means
- ✅ **Free to use** - personal and commercial use allowed
- ✅ **Free to modify** - adapt the code to your needs
- ✅ **Free to distribute** - share with others
- ✅ **No warranty** - use at your own risk
- ✅ **Attribution appreciated** - but not required

## 🙏 Acknowledgments

- **Original developer Pear104** who created the base automation functionality
- **Community contributors** who help maintain the FPT answer database
- **Open source community** for tools and libraries used
- **Privacy advocates** who inspired our tracking-free approach
- **Users** who provide feedback and bug reports

## ⭐ Star This Repository

If this tool has helped you with your Coursera courses, please consider:
- ⭐ **Starring this repository** to show your support
- 🍴 **Forking** to contribute improvements
- 📢 **Sharing** with classmates who might benefit
- 💬 **Providing feedback** to help us improve

---

**Made with ❤️ for the FPTU community**

*An open-source, privacy-focused automation tool that respects your data and academic journey.*
