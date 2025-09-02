#!/usr/bin/env python3
"""
Lines of Code Counter
Counts total lines of code in the ProperLCP directory
"""

import os
import glob
from pathlib import Path

def count_lines_in_file(file_path):
    """Count lines in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            return len(file.readlines())
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return 0

def is_code_file(file_path):
    """Check if file is a code file based on extension"""
    code_extensions = {
        '.js', '.html', '.css', '.json', '.py', '.sql', '.md', '.txt',
        '.jsx', '.ts', '.tsx', '.vue', '.php', '.java', '.c', '.cpp',
        '.h', '.hpp', '.cs', '.go', '.rs', '.rb', '.swift', '.kt',
        '.scala', '.clj', '.hs', '.elm', '.dart', '.r', '.m', '.mm',
        '.sh', '.bat', '.ps1', '.yml', '.yaml', '.xml', '.svg'
    }
    
    file_extension = Path(file_path).suffix.lower()
    return file_extension in code_extensions

def should_exclude_directory(dir_path):
    """Check if directory should be excluded"""
    exclude_dirs = {
        'node_modules', '.git', '__pycache__', '.vscode', '.idea',
        'dist', 'build', 'coverage', '.nyc_output', 'logs', 'tmp',
        'temp', '.cache', '.next', '.nuxt', 'vendor', 'packages'
    }
    
    dir_name = os.path.basename(dir_path)
    return dir_name in exclude_dirs

def count_lines_recursive(directory):
    """Recursively count lines in all code files"""
    total_lines = 0
    file_count = 0
    file_stats = {}
    
    for root, dirs, files in os.walk(directory):
        # Remove excluded directories from dirs list to prevent walking into them
        dirs[:] = [d for d in dirs if not should_exclude_directory(os.path.join(root, d))]
        
        for file in files:
            file_path = os.path.join(root, file)
            
            if is_code_file(file_path):
                lines = count_lines_in_file(file_path)
                total_lines += lines
                file_count += 1
                
                # Get file extension for statistics
                ext = Path(file_path).suffix.lower()
                if ext in file_stats:
                    file_stats[ext]['files'] += 1
                    file_stats[ext]['lines'] += lines
                else:
                    file_stats[ext] = {'files': 1, 'lines': lines}
                
                # Print file details
                relative_path = os.path.relpath(file_path, directory)
                print(f"{relative_path}: {lines} lines")
    
    return total_lines, file_count, file_stats

def main():
    """Main function"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Lines of Code Counter for ProperLCP")
    print("=" * 50)
    print(f"Scanning directory: {script_dir}")
    print("=" * 50)
    
    total_lines, file_count, file_stats = count_lines_recursive(script_dir)
    
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Total files processed: {file_count}")
    print(f"Total lines of code: {total_lines:,}")
    
    print("\nBreakdown by file type:")
    print("-" * 30)
    
    # Sort by number of lines (descending)
    sorted_stats = sorted(file_stats.items(), key=lambda x: x[1]['lines'], reverse=True)
    
    for ext, stats in sorted_stats:
        ext_name = ext if ext else 'no extension'
        print(f"{ext_name:10}: {stats['files']:3} files, {stats['lines']:6,} lines")
    
    print("\nExcluded directories: node_modules, .git, __pycache__, .vscode, etc.")
    print("Included file types: .js, .html, .css, .json, .py, .sql, .md, .txt, etc.")

if __name__ == "__main__":
    main()
