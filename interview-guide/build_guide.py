from pathlib import Path
import re, html, ast

root = Path(__file__).parent
source = root / 'RAG_Interview_Guide.md'
md = source.read_text(encoding='utf-8')
numbers = [int(n) for n in re.findall(r'^### (\d+)\.', md, re.M)]
assert numbers == list(range(1, 111)), numbers
codes = re.findall(r'```python\n(.*?)```', md, re.S)
assert len(codes) == 1
ast.parse(codes[0])
(root / 'server.py').write_text(codes[0], encoding='utf-8')
# Test the deterministic demo retrieval without installing or mocking the SDK.
tree = ast.parse(codes[0])
selected = [n for n in tree.body if (isinstance(n, ast.Import) and n.names[0].name == 're')
            or (isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'DOCUMENTS' for t in n.targets))
            or (isinstance(n, ast.FunctionDef) and n.name in ('words', 'rank_documents'))]
ns = {}
exec(compile(ast.Module(body=selected, type_ignores=[]), 'demo', 'exec'), ns)
assert ns['rank_documents']('RAG')[0]['id'] == 'rag-1'
assert ns['rank_documents']('MCP')[0]['id'] == 'mcp-1'
assert ns['rank_documents']('unfindableword') == []
for q, limit in [('', 3), ('a' * 1001, 3), ('RAG', 0), ('RAG', 6)]:
    try:
        ns['rank_documents'](q, limit)
        raise AssertionError('Expected validation failure')
    except ValueError:
        pass

def inline(s):
    s = html.escape(s)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'(https://[^\s<]+)', r'<a href="\1" target="_blank" rel="noopener">\1</a>', s)
    s = re.sub(r'\[S(\d+)\]', r'<a class="cite" href="#source-\1">[S\1]</a>', s)
    return s

lines = md.splitlines()
out, toc = [], []
i = 0
article_open = False
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1
        continue
    if line.startswith('```'):
        lang = line[3:]
        block = []
        i += 1
        while i < len(lines) and not lines[i].startswith('```'):
            block.append(lines[i]); i += 1
        out.append('<pre><code>' + html.escape('\n'.join(block)) + '</code></pre>')
    elif line.startswith('# '):
        out.append('<h1>' + inline(line[2:]) + '</h1>')
    elif line.startswith('## '):
        if article_open:
            out.append('</article>'); article_open = False
        title = line[3:]
        ident = 'section-' + str(len(toc) + 1)
        toc.append((ident, title))
        out.append(f'<h2 id="{ident}">{inline(title)}</h2>')
    elif line.startswith('### '):
        if article_open: out.append('</article>')
        n = re.match(r'### (\d+)', line).group(1)
        out.append(f'<article class="question" id="q{n}"><h3>{inline(line[4:])}</h3>')
        article_open = True
    elif line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            cells = [c.strip() for c in lines[i].strip('|').split('|')]
            if not all(re.fullmatch(r'[-: ]+', c) for c in cells): rows.append(cells)
            i += 1
        out.append('<div class="table-wrap"><table><thead><tr>' + ''.join('<th>'+inline(c)+'</th>' for c in rows[0]) + '</tr></thead><tbody>')
        for row in rows[1:]: out.append('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>')
        out.append('</tbody></table></div>')
        continue
    elif line.startswith('- '):
        out.append('<ul class="sources">')
        while i < len(lines) and lines[i].startswith('- '):
            sm = re.match(r'- S(\d+)\.', lines[i])
            ident = f' id="source-{sm.group(1)}"' if sm else ''
            out.append(f'<li{ident}>'+inline(lines[i][2:])+'</li>'); i += 1
        out.append('</ul>')
        continue
    else:
        para = [line]
        while i + 1 < len(lines) and lines[i+1].strip() and not lines[i+1].startswith(('#', '```', '|', '- ')):
            i += 1; para.append(lines[i])
        out.append('<p>'+inline(' '.join(para))+'</p>')
    i += 1
if article_open: out.append('</article>')

css = '''
:root{color-scheme:light;--ink:#17212b;--muted:#56616d;--line:#d9dfe5;--link:#145c86}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:28px}body{margin:0;background:#f5f6f8;color:var(--ink);font:17px/1.72 Georgia,'Times New Roman',serif}
aside{position:fixed;inset:0 auto 0 0;width:280px;padding:30px 24px;background:#fff;border-right:1px solid var(--line);overflow:auto;font:14px/1.5 'Segoe UI',sans-serif}
.brand{font-weight:700;letter-spacing:.08em;font-size:12px;color:#52616c;margin-bottom:9px}.stats{font-size:13px;color:var(--muted);margin-bottom:22px}nav a{display:block;padding:6px 0;color:#34424f;text-decoration:none}nav a:hover{color:var(--link);text-decoration:underline}
main{margin:36px 40px 60px 320px;max-width:940px;padding:48px 64px;background:#fff;box-shadow:0 4px 20px #16232b08}
h1,h2,h3{color:#000;font-family:'Segoe UI',Arial,sans-serif;line-height:1.28}h1{font-size:39px;margin:0 0 22px;font-weight:700;letter-spacing:-1px}h2{font-size:27px;margin:54px 0 22px;scroll-margin-top:24px}h3{font-size:21px;margin:0 0 15px}p{margin:0 0 17px}.question{margin:32px 0 40px;scroll-margin-top:24px}a{color:var(--link);text-underline-offset:3px;overflow-wrap:anywhere}.cite{font:13px 'Segoe UI',sans-serif;white-space:nowrap}code{font:13px/1.6 Consolas,monospace}p code{background:#f0f3f5;padding:2px 4px}pre{padding:20px;background:#f4f6f8;overflow:auto;line-height:1.5;border:1px solid var(--line);tab-size:4}
table{width:100%;border-collapse:collapse;font:14px/1.5 'Segoe UI',sans-serif}th,td{border:1px solid #d9d9d9;padding:12px;text-align:left;vertical-align:middle}th{background:#e8eff5;color:#000}tbody tr:nth-child(even){background:#f8fafb}.table-wrap{overflow:auto}.sources{padding-left:22px;font-size:15px}.sources li{margin-bottom:15px}
.controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}button,input{font:14px 'Segoe UI',sans-serif}button{background:#fff;border:1px solid #bcc7d0;border-radius:4px;padding:8px 12px;cursor:pointer}button:hover{background:#eef3f6}input{width:100%;padding:10px;border:1px solid #bcc7d0;border-radius:4px}#results{font-size:12px;min-height:22px;color:var(--muted);margin:6px 0 12px}.hide-answers .question p,.hide-answers .question pre{display:none}.question[hidden]{display:none}.note{font:13px/1.5 'Segoe UI',sans-serif;color:var(--muted);margin-top:20px}
@media(max-width:1050px){aside{width:230px;padding:24px 18px}main{margin-left:250px;margin-right:20px;padding:35px}}
@media(max-width:740px){aside{position:static;width:auto;border-right:0;border-bottom:1px solid var(--line)}nav{max-height:190px;overflow:auto}main{margin:0;padding:30px 22px;box-shadow:none}h1{font-size:32px}h2{font-size:25px}body{font-size:16px}}
@media print{@page{size:A4;margin:18mm 17mm}body{background:#fff;font-size:10.5pt;line-height:1.45}aside{display:none}main{margin:0;padding:0;max-width:none;box-shadow:none}h1{font-size:28pt}h2{font-size:19pt;margin-top:26pt;break-after:avoid}h3{font-size:13pt;break-after:avoid}.question{margin:20pt 0}p{orphans:3;widows:3;margin-bottom:9pt}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:8pt}code{font-size:8pt}table{font-size:9pt}thead{display:table-header-group}tr{break-inside:avoid}a{color:#111}h2,h3{page-break-after:avoid}.question[hidden]{display:block!important}.hide-answers .question p,.hide-answers .question pre{display:block!important}}
'''
js = '''
const input=document.getElementById('search');
const questions=[...document.querySelectorAll('.question')];
input.addEventListener('input',()=>{const q=input.value.toLowerCase().trim();let n=0;questions.forEach(el=>{const match=!q||el.textContent.toLowerCase().includes(q);el.hidden=!match;if(match)n++});document.getElementById('results').textContent=q?`${n} of 110 questions match`:'110 questions and detailed answers'});
document.getElementById('practice').addEventListener('click',e=>{const enabled=document.body.classList.toggle('hide-answers');e.target.textContent=enabled?'Show answers':'Practice questions';e.target.setAttribute('aria-pressed',String(enabled))});
document.getElementById('print').addEventListener('click',()=>window.print());
'''
nav = ''.join(f'<a href="#{ident}">{html.escape(title)}</a>' for ident,title in toc)
document = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RAG Application Interview Guide</title><style>{css}</style></head><body><aside><div class="brand">INTERVIEW STUDY GUIDE</div><div class="stats">110 questions · Beginner to advanced</div><div class="controls"><button id="practice" aria-pressed="false">Practice questions</button><button id="print">Print or save PDF</button></div><label for="search">Search questions and answers</label><input id="search" type="search" placeholder="Try MCP, chunking, deployment"><div id="results" aria-live="polite">110 questions and detailed answers</div><nav aria-label="Contents">{nav}</nav><p class="note">Use practice mode to hide answers. Printing includes the complete guide.</p></aside><main>{''.join(out)}</main><script>{js}</script></body></html>'''
(root / 'RAG_Interview_Guide.html').write_text(document, encoding='utf-8')
print({'questions':len(numbers),'words':len(md.split()),'references':len(re.findall(r'^- S\d+\.',md,re.M)), 'demo_logic_tests':'passed','mcp_transport_test':'not run; SDK is not installed','html_bytes':len(document.encode())})
