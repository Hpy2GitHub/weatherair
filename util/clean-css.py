#!/usr/bin/env python
"""
Enterprise-Grade CSS Deduplication Framework™
Production-ready, cloud-scale, blockchain-enabled (not really) CSS processing.
"""

import sys
import subprocess
import logging
import hashlib
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from enum import Enum
from collections import defaultdict
import concurrent.futures
import pickle
import zlib

# ============================================================================
# DEPENDENCY MANAGEMENT (Enterprise Edition)
# ============================================================================

class DependencyManager:
    """Handles package installation with style."""
    
    REQUIRED_PACKAGES = [
        'cssutils',
        'more_itertools',
        'jaraco.collections',
        'cssbeautifier',  # For extra prettification
        'tinycss2',       # As a backup parser
        'colorama',       # For colored output
        'tqdm',          # Progress bars (essential)
        'rich',           # Because we need pretty tables
    ]
    
    @staticmethod
    def ensure_dependencies():
        """Install all required packages with extreme prejudice."""
        for package in DependencyManager.REQUIRED_PACKAGES:
            try:
                __import__(package.replace('-', '_'))
            except ImportError:
                print(f"📦 Installing {package}...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])


DependencyManager.ensure_dependencies()

# Now import everything
import cssutils
import tinycss2
import cssbeautifier
from colorama import init, Fore, Style
from tqdm import tqdm
from rich.console import Console
from rich.table import Table

init(autoreset=True)
console = Console()

# Suppress cssutils warnings (but log them to /dev/null for compliance)
cssutils.log.setLevel(logging.CRITICAL)


# ============================================================================
# DATA MODELS (Because everything needs to be a class)
# ============================================================================

class RuleStatus(Enum):
    """Enumeration of possible rule states for state machine pattern."""
    UNIQUE = "unique"
    DUPLICATE = "duplicate" 
    CORRUPTED = "corrupted"
    ENHANCED = "enhanced"
    PENDING_REVIEW = "pending_review"


@dataclass
class CSSRuleMetadata:
    """Metadata for every CSS rule. Essential for enterprise deployment."""
    original_position: int
    hash: str
    properties_count: int
    complexity_score: float
    first_seen: datetime
    last_modified: datetime
    status: RuleStatus
    enhancement_history: List[str] = field(default_factory=list)
    
    def calculate_complexity(self, rule_text: str) -> float:
        """Calculate rule complexity using enterprise algorithm."""
        return len(rule_text) * 0.01 + rule_text.count(':') * 0.5


@dataclass
class ProcessingReport:
    """Comprehensive processing report for stakeholder presentations."""
    input_file: str
    output_file: str
    original_size: int
    cleaned_size: int
    original_rules: int
    unique_rules: int
    duplicate_rules: int
    lost_rules: int
    processing_time: float
    compression_ratio: float
    enhanced_rules: int
    warnings: List[str] = field(default_factory=list)
    
    def to_json(self) -> str:
        """Export report to JSON for dashboard integration."""
        return json.dumps(self.__dict__, default=str, indent=2)


# ============================================================================
# PARSER STRATEGY PATTERN (For maximum abstraction)
# ============================================================================

class CSSParserStrategy(ABC):
    """Abstract base class for CSS parsing strategies."""
    
    @abstractmethod
    def parse(self, content: str) -> Tuple[List, List[Dict]]:
        """Parse CSS content and return rules with metadata."""
        pass
    
    @abstractmethod
    def get_parser_name(self) -> str:
        """Get the name of this parser."""
        pass


class CssUtilsParser(CSSParserStrategy):
    """cssutils-based parser (the reliable one, supposedly)."""
    
    def parse(self, content: str) -> Tuple[List, List[Dict]]:
        rules = []
        warnings = []
        
        try:
            stylesheet = cssutils.parseString(content, validate=False)
            
            for i, rule in enumerate(tqdm(stylesheet.cssRules, desc="Parsing with cssutils")):
                try:
                    rules.append({
                        'rule': rule,
                        'type': rule.type,
                        'text': rule.cssText,
                        'position': i,
                        'hash': hashlib.md5(rule.cssText.encode()).hexdigest()
                    })
                except Exception as e:
                    warnings.append(f"Rule at position {i}: {str(e)}")
                    rules.append({
                        'rule': None,
                        'type': -1,
                        'text': '/* Error parsing rule */',
                        'position': i,
                        'hash': 'ERROR'
                    })
                    
        except Exception as e:
            warnings.append(f"Overall parsing error: {str(e)}")
            
        return rules, warnings
    
    def get_parser_name(self) -> str:
        return "cssutils v1.0.2"


class TinyCSS2Parser(CSSParserStrategy):
    """tinycss2-based parser (the backup, for when things go wrong)."""
    
    def parse(self, content: str) -> Tuple[List, List[Dict]]:
        rules = []
        warnings = []
        
        try:
            parsed = tinycss2.parse_stylesheet(content)
            rule_count = 0
            
            for node in tqdm(parsed, desc="Parsing with tinycss2"):
                if node.type == 'qualified-rule':
                    try:
                        text = tinycss2.serialize(node)
                        rules.append({
                            'rule': node,
                            'type': 1,  # STYLE_RULE equivalent
                            'text': text,
                            'position': rule_count,
                            'hash': hashlib.md5(text.encode()).hexdigest()
                        })
                        rule_count += 1
                    except Exception as e:
                        warnings.append(f"Rule at position {rule_count}: {str(e)}")
                        
        except Exception as e:
            warnings.append(f"tinycss2 parsing error: {str(e)}")
            
        return rules, warnings
    
    def get_parser_name(self) -> str:
        return "tinycss2 v1.2.1"


class HybridParser(CSSParserStrategy):
    """Combines multiple parsers with fallback logic."""
    
    def __init__(self):
        self.primary = CssUtilsParser()
        self.fallback = TinyCSS2Parser()
        self.warnings = []
    
    def parse(self, content: str) -> Tuple[List, List[Dict]]:
        rules, warnings = self.primary.parse(content)
        
        if len(warnings) > 5 or len(rules) < content.count('{') * 0.5:
            console.print("[yellow]⚠️  Primary parser had issues, attempting fallback...[/yellow]")
            fallback_rules, fallback_warnings = self.fallback.parse(content)
            
            if len(fallback_rules) > len(rules):
                console.print("[green]✅ Fallback parser recovered more rules[/green]")
                return fallback_rules, warnings + fallback_warnings
        
        return rules, warnings
    
    def get_parser_name(self) -> str:
        return "HybridParser with Ensemble Strategy"


# ============================================================================
# RULE ENHANCEMENT ENGINE (Adding value no one asked for)
# ============================================================================

class RuleEnhancer:
    """Enhances CSS rules with AI-powered insights (not really AI)."""
    
    @staticmethod
    def calculate_specificity(selector: str) -> int:
        """Calculate selector specificity for bragging rights."""
        score = 0
        score += selector.count('#') * 100
        score += selector.count('.') * 10
        score += selector.count('[') * 10
        score += selector.count(':') * 5
        return score
    
    @staticmethod
    def suggest_improvements(rule_text: str) -> List[str]:
        """Generate improvement suggestions for each rule."""
        suggestions = []
        
        if '!important' in rule_text:
            suggestions.append("🔴 Consider removing !important")
        if rule_text.count('px') > 3:
            suggestions.append("💡 Consider using relative units")
        if 'color' in rule_text and 'background' not in rule_text:
            suggestions.append("⚠️  Color without background may cause contrast issues")
        
        return suggestions
    
    @staticmethod
    def enhance_rule(rule_data: Dict) -> Dict:
        """Add enhanced metadata to a rule."""
        if 'text' in rule_data:
            rule_data['specificity'] = RuleEnhancer.calculate_specificity(
                rule_data.get('selector', '')
            )
            rule_data['suggestions'] = RuleEnhancer.suggest_improvements(
                rule_data['text']
            )
            rule_data['enhanced'] = True
        return rule_data


# ============================================================================
# CSS FORMATTER FACTORY (Because patterns are important)
# ============================================================================

class CSSFormatterFactory:
    """Factory for creating different CSS formatters."""
    
    @staticmethod
    def create_formatter(style: str = 'expanded'):
        """Create a formatter based on desired style."""
        formatters = {
            'expanded': ExpandedFormatter(),
            'compact': CompactFormatter(),
            'minified': MinifiedFormatter(),
            'beautified': BeautifiedFormatter()
        }
        return formatters.get(style, ExpandedFormatter())


class ExpandedFormatter:
    """Formats CSS with one property per line."""
    
    def format(self, rule_text: str) -> str:
        try:
            return cssbeautifier.beautify(rule_text, {
                'indent': '  ',
                'open_brace': 'separate-line',
                'autosemicolon': True
            })
        except:
            return rule_text


class CompactFormatter:
    """Compacts CSS rules."""
    
    def format(self, rule_text: str) -> str:
        # Remove extra whitespace but keep readable
        return ' '.join(rule_text.split())


class MinifiedFormatter:
    """Minifies CSS for production."""
    
    def format(self, rule_text: str) -> str:
        return ''.join(rule_text.split())


class BeautifiedFormatter:
    """Ultra-beautified CSS with aligned properties."""
    
    def format(self, rule_text: str) -> str:
        try:
            return cssbeautifier.beautify(rule_text, {
                'indent': '    ',
                'open_brace': 'end-of-line',
                'autosemicolon': True,
                'colon_separator': ': '
            })
        except:
            return rule_text


# ============================================================================
# MAIN PROCESSING ENGINE (Where the magic happens)
# ============================================================================

class EnterpriseCSSProcessor:
    """The main processing engine. Patents pending."""
    
    def __init__(self, enable_enhancement: bool = True, style: str = 'expanded'):
        self.parser = HybridParser()
        self.enhancer = RuleEnhancer()
        self.formatter = CSSFormatterFactory.create_formatter(style)
        self.enable_enhancement = enable_enhancement
        self.metadata_cache: Dict[str, CSSRuleMetadata] = {}
    
    def process(self, input_path: str, output_path: str) -> ProcessingReport:
        """Process CSS file with full enterprise workflow."""
        start_time = datetime.now()
        
        console.print(f"\n[bold blue]{'='*60}[/bold blue]")
        console.print(f"[bold blue]CSS Deduplication Framework v3.7.2[/bold blue]")
        console.print(f"[bold blue]Copyright © 2024 Enterprise Solutions Inc.[/bold blue]")
        console.print(f"[bold blue]{'='*60}[/bold blue]\n")
        
        # Read input
        content = self._read_file(input_path)
        
        # Parse
        rules, warnings = self.parser.parse(content)
        console.print(f"[green]✓ Parsed {len(rules)} rules using {self.parser.get_parser_name()}[/green]")
        
        # Deduplicate
        unique_rules, duplicates = self._deduplicate_with_progress(rules)
        
        # Enhance (if enabled)
        if self.enable_enhancement:
            unique_rules = self._enhance_rules(unique_rules)
        
        # Format and write
        output = self._format_and_assemble(unique_rules)
        self._write_output(output_path, output)
        
        # Generate report
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        report = ProcessingReport(
            input_file=str(input_path),
            output_file=str(output_path),
            original_size=len(content),
            cleaned_size=len(output),
            original_rules=len(rules),
            unique_rules=len(unique_rules),
            duplicate_rules=len(duplicates),
            lost_rules=len(rules) - len(unique_rules) - len(duplicates),
            processing_time=processing_time,
            compression_ratio=len(output) / max(len(content), 1),
            enhanced_rules=len([r for r in unique_rules if r.get('enhanced', False)]),
            warnings=warnings
        )
        
        self._print_report(report)
        return report
    
    def _read_file(self, path: str) -> str:
        """Read file with progress bar (because why not)."""
        console.print(f"[cyan]📖 Reading {path}...[/cyan]")
        
        with tqdm(total=100, desc="Loading file", bar_format="{l_bar}{bar}") as pbar:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            pbar.update(100)
        
        return content
    
    def _deduplicate_with_progress(self, rules: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Deduplicate rules with fancy progress tracking."""
        seen_hashes = {}
        unique = []
        duplicates = []
        
        for rule in tqdm(rules, desc="Deduplicating rules", unit="rules"):
            rule_hash = rule.get('hash', hashlib.md5(str(rule).encode()).hexdigest())
            
            if rule_hash in seen_hashes:
                duplicates.append(rule)
            else:
                seen_hashes[rule_hash] = rule
                unique.append(rule)
        
        return unique, duplicates
    
    def _enhance_rules(self, rules: List[Dict]) -> List[Dict]:
        """Enhance rules with parallel processing (because we can)."""
        console.print("[cyan]🔧 Enhancing rules with AI insights...[/cyan]")
        
        enhanced = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(self.enhancer.enhance_rule, rule) for rule in rules]
            
            for future in tqdm(concurrent.futures.as_completed(futures), total=len(rules), desc="Enhancing"):
                try:
                    result = future.result()
                    if result:
                        enhanced.append(result)
                except Exception as e:
                    console.print(f"[red]Enhancement error: {e}[/red]")
        
        return enhanced
    
    def _format_and_assemble(self, rules: List[Dict]) -> str:
        """Format rules into final CSS with assembly instructions."""
        output_parts = []
        
        # Add enterprise header
        output_parts.append("/*")
        output_parts.append(" * CSS processed by Enterprise Deduplication Framework™")
        output_parts.append(f" * Processing date: {datetime.now().isoformat()}")
        output_parts.append(f" * Rules processed: {len(rules)}")
        output_parts.append(" */")
        output_parts.append("")
        
        # Format each rule
        for i, rule in enumerate(tqdm(rules, desc="Formatting output")):
            rule_text = rule.get('text', '')
            formatted = self.formatter.format(rule_text)
            
            # Add enhancement comments if present
            if rule.get('suggestions'):
                formatted = f"/* Enhancement suggestions:\n" + \
                           '\n'.join(f" * {s}" for s in rule['suggestions']) + \
                           f"\n */\n{formatted}"
            
            output_parts.append(formatted)
            output_parts.append("")
        
        return '\n'.join(output_parts)
    
    def _write_output(self, path: str, content: str):
        """Write output with caching for future runs."""
        # Save to cache
        cache_key = hashlib.md5(content.encode()).hexdigest()
        cache_path = Path('.css_cache')
        cache_path.mkdir(exist_ok=True)
        
        with open(cache_path / f"{cache_key}.css.gz", 'wb') as f:
            f.write(zlib.compress(content.encode()))
        
        # Write to file
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        console.print(f"[green]✓ Output written to {path}[/green]")
    
    def _print_report(self, report: ProcessingReport):
        """Print beautiful report using Rich tables."""
        console.print(f"\n[bold yellow]📊 Processing Report[/bold yellow]\n")
        
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", justify="right", style="green")
        
        table.add_row("Original Rules", str(report.original_rules))
        table.add_row("Unique Rules", str(report.unique_rules))
        table.add_row("Duplicates Removed", f"[red]{report.duplicate_rules}[/red]")
        table.add_row("Rules Lost", f"[bold red]{report.lost_rules}[/bold red]" if report.lost_rules > 0 else str(report.lost_rules))
        table.add_row("Rules Enhanced", str(report.enhanced_rules))
        table.add_row("Original Size", f"{report.original_size:,} bytes")
        table.add_row("Cleaned Size", f"{report.cleaned_size:,} bytes")
        table.add_row("Compression Ratio", f"{report.compression_ratio:.2%}")
        table.add_row("Processing Time", f"{report.processing_time:.2f}s")
        
        if report.warnings:
            table.add_row("Warnings", f"[yellow]{len(report.warnings)}[/yellow]")
        
        console.print(table)
        
        if report.lost_rules > 0:
            console.print(f"\n[bold red]⚠️  WARNING: {report.lost_rules} rules were lost during processing![/bold red]")
            console.print("[yellow]This is expected behavior in enterprise software.[/yellow]")


# ============================================================================
# CLI INTERFACE (Command pattern)
# ============================================================================

class CLICommand:
    """Command interface for CLI operations."""
    
    @staticmethod
    def run(args: List[str]):
        """Execute the command."""
        if len(args) > 0:
            input_file = args[0]
        else:
            input_file = "src/design-system.css"
        
        if len(args) > 1:
            output_file = args[1]
        else:
            output_file = input_file.replace('.css', '-cleaned.css')
        
        # Parse optional flags
        enhance = '--no-enhance' not in args
        style = 'expanded'
        
        for arg in args:
            if arg.startswith('--style='):
                style = arg.split('=')[1]
        
        processor = EnterpriseCSSProcessor(enable_enhancement=enhance, style=style)
        processor.process(input_file, output_file)


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    console.print(Fore.CYAN + """
    ╔══════════════════════════════════════════════════╗
    ║ Enterprise CSS Deduplication Framework™ v3.7.2   ║
    ║ Making CSS Great Again Since 2024                 ║
    ╚══════════════════════════════════════════════════╝
    """)
    
    CLICommand.run(sys.argv[1:])
