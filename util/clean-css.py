#!/usr/bin/env python

import re
from collections import OrderedDict

def parse_css_with_comments(css_content):
    """
    Parse CSS content, separating comments/sections from rules.
    Keep track of the last definition for each selector.
    """
    lines = css_content.splitlines()
    rules = {}  # selector -> (full_block, last_line_number)
    current_comment_blocks = []  # Preserve section comments in order
    current_section = []
    i = 0
    
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Collect comment blocks (sections)
        if line.strip().startswith('/*') or (line.strip() and line.strip().startswith('*')):
            # Start of a comment section
            section = []
            while i < len(lines) and (lines[i].strip().startswith('/*') or 
                                     lines[i].strip().startswith('*') or 
                                     not lines[i].strip()):
                section.append(lines[i])
                i += 1
            if section:
                current_comment_blocks.append('\n'.join(section))
            continue
        
        # Skip empty lines for now, we'll handle formatting later
        if not line.strip():
            i += 1
            continue
        
        # Find start of a rule
        if '{' in line:
            # Extract selector
            selector_match = re.match(r'^\s*([^{]+?)\s*\{', line)
            if selector_match:
                selector = selector_match.group(1).strip()
                
                # Collect the entire rule block
                block_lines = [line]
                brace_count = line.count('{') - line.count('}')
                j = i + 1
                
                while j < len(lines) and brace_count > 0:
                    next_line = lines[j]
                    block_lines.append(next_line)
                    brace_count += next_line.count('{') - next_line.count('}')
                    j += 1
                
                full_block = '\n'.join(block_lines)
                
                # Store or update (keep latest)
                rules[selector] = (full_block, i)
                
                i = j
                continue
        
        # Media queries and other complex blocks (basic support)
        elif line.strip().startswith('@'):
            # For simplicity, treat @media etc as unique by their full opening
            block_lines = [line]
            brace_count = line.count('{') - line.count('}')
            j = i + 1
            while j < len(lines) and brace_count >= 0:
                next_line = lines[j]
                block_lines.append(next_line)
                brace_count += next_line.count('{') - next_line.count('}')
                j += 1
            full_block = '\n'.join(block_lines)
            # Use the @ rule as key (they are usually unique)
            rules[line.strip().split('{')[0].strip()] = (full_block, i)
            i = j
            continue
        
        i += 1
    
    return rules, current_comment_blocks


def format_rule_block(block):
    """Format a CSS rule with each property on its own line."""
    # Split selector and body
    if '{' not in block:
        return block
    
    parts = block.split('{', 1)
    selector = parts[0].strip()
    body = parts[1].rsplit('}', 1)[0].strip()
    
    # Split properties
    properties = []
    for prop_line in re.split(r';\s*', body):
        prop_line = prop_line.strip()
        if prop_line:
            if ':' in prop_line:
                properties.append(prop_line.rstrip(';') + ';')
            else:
                properties.append(prop_line)
    
    formatted_body = '\n  ' + '\n  '.join(properties) if properties else ''
    
    return f"{selector} {{\n{formatted_body}\n}}"


def regenerate_css(input_css):
    rules_dict, comment_blocks = parse_css_with_comments(input_css)
    
    # Sort rules by their original last appearance order
    sorted_rules = sorted(rules_dict.items(), key=lambda x: x[1][1])
    
    output = []
    output.append("/*")
    output.append(" * design-system.css")
    output.append(" * Deduplicated and cleaned version.")
    output.append(" * Only the last occurrence of each rule is kept.")
    output.append(" */")
    output.append("")
    
    # Add back top-level comments/sections
    for comment in comment_blocks:
        if comment.strip():
            output.append(comment)
            output.append("")
    
    # Add formatted rules
    for selector, (block, _) in sorted_rules:
        formatted = format_rule_block(block)
        output.append(formatted)
        output.append("")  # spacing between rules
    
    return '\n'.join(output).strip() + '\n'


# =============== USAGE ===============
if __name__ == "__main__":
    # Read the original file
    with open("src/design-system.css", "r", encoding="utf-8") as f:
        original_css = f.read()
    
    cleaned = regenerate_css(original_css)
    
    # Write to new file
    output_path = "src/design-system-cleaned.css"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(cleaned)
    
    print(f"Cleaned CSS written to: {output_path}")
    print("Duplicates removed. Only latest definition of each rule kept.")
    print("Rules are now nicely formatted with one property per line.")
