from pathlib import Path
import re, html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

root=Path(__file__).resolve().parent
dest=root.parent/'output'/'pdf'; dest.mkdir(parents=True,exist_ok=True)
fontdir=Path('C:/Windows/Fonts')
for name,file in [('Body','arial.ttf'),('BodyBold','arialbd.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(fontdir/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='Body',boldItalic='BodyBold')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Text',fontName='Body',fontSize=10.2,leading=15,spaceAfter=9))
styles.add(ParagraphStyle(name='TitleCustom',fontName='BodyBold',fontSize=29,leading=35,spaceAfter=20))
styles.add(ParagraphStyle(name='Section',fontName='BodyBold',fontSize=17,leading=22,spaceBefore=19,spaceAfter=12,keepWithNext=True))
styles.add(ParagraphStyle(name='Question',fontName='BodyBold',fontSize=11.8,leading=16,spaceBefore=13,spaceAfter=8,keepWithNext=True))
styles.add(ParagraphStyle(name='CodeCustom',fontName='Mono',fontSize=7.5,leading=10,spaceBefore=8,spaceAfter=12))
styles.add(ParagraphStyle(name='Cell',fontName='Body',fontSize=8,leading=11,spaceAfter=0))
styles.add(ParagraphStyle(name='TOCEntry',fontName='Body',fontSize=11,leading=18,spaceAfter=6))
def clean(s):
    return s.replace('–','-').replace('—','-').replace('‑','-')
def fmt(s):
    s=html.escape(clean(s))
    s=re.sub(r'`([^`]+)`',r'<font name="Mono" size="9">\1</font>',s)
    s=re.sub(r'(https://[^\s<]+)',r'<link href="\1" color="#145c86">\1</link>',s)
    return s
md=(root/'RAG_Interview_Guide.md').read_text(encoding='utf-8')
lines=md.splitlines()
sections=[x[3:] for x in lines if x.startswith('## ')]
story=[Paragraph('RAG Application<br/>Interview Guide',styles['TitleCustom']),Paragraph('110 detailed questions and answers',styles['Section']),Paragraph('Beginner to advanced | 27 October 2026',styles['Text']),Spacer(1,15),Paragraph('A comprehensive study guide covering RAG architecture, Transformer theory, retrieval, model selection, MCP server development, transcription, evaluation, deployment, and advanced system design.',styles['Text']),Spacer(1,16),Paragraph('How to use this guide',styles['Question']),Paragraph('Study the numbered questions in order, or use the contents and PDF bookmarks to jump to a topic. Each answer explains the concept, its practical use, and important tradeoffs. Code examples and references are included.',styles['Text']),PageBreak(),Paragraph('Contents',styles['Section'])]
for idx,s in enumerate(sections):
    story.append(Paragraph(f'<link href="#s{idx}" color="#145c86">{html.escape(s)}</link>',styles['TOCEntry']))
story.append(PageBreak())
i=1;sec=0
while i<len(lines):
    line=lines[i]
    if not line.strip():i+=1;continue
    if line.startswith('## '):
        story.append(Paragraph(f'<a name="s{sec}"/>'+fmt(line[3:]),styles['Section']));sec+=1
    elif line.startswith('### '):
        story.append(Paragraph(fmt(line[4:]),styles['Question']))
    elif line.startswith('```'):
        block=[];i+=1
        while i<len(lines) and not lines[i].startswith('```'):
            block.append(clean(lines[i]));i+=1
        story.append(Preformatted('\n'.join(block),styles['CodeCustom'],maxLineLength=92,splitChars=' ',newLineChars='  '))
    elif line.startswith('|'):
        rows=[]
        while i<len(lines) and lines[i].startswith('|'):
            cells=[c.strip() for c in lines[i].strip('|').split('|')]
            if not all(re.fullmatch(r'[-: ]+',c) for c in cells):rows.append([Paragraph(fmt(c),styles['Cell']) for c in cells])
            i+=1
        t=Table(rows,colWidths=[115,125,120,115],repeatRows=1,hAlign='LEFT')
        t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.5,colors.HexColor('#d9d9d9')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8eff5')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
        story.append(t);continue
    else:
        para=[line[2:] if line.startswith('- ') else line]
        while i+1<len(lines) and lines[i+1].strip() and not lines[i+1].startswith(('#','```','|','- ')):
            i+=1;para.append(lines[i])
        story.append(Paragraph(fmt(' '.join(para)),styles['Text']))
    i+=1
def footer(canvas,doc):
    canvas.setFont('Body',8)
    canvas.setFillColor(colors.HexColor('#59636e'))
    canvas.drawString(58,30,'RAG Application Interview Guide')
    canvas.drawRightString(A4[0]-58,30,str(doc.page))
class GuideDoc(SimpleDocTemplate):
    def afterFlowable(self,flowable):
        if isinstance(flowable,Paragraph) and flowable.style.name=='Section':
            key='bookmark'+str(self.seq.nextf('bookmark'))
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.getPlainText(),key,0,False)
out=dest/'RAG_Interview_Guide.pdf'
doc=GuideDoc(str(out),pagesize=A4,rightMargin=58,leftMargin=58,topMargin=48,bottomMargin=50,title='RAG Application Interview Guide',author='')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(out)
text='\n'.join(p.extract_text() for p in reader.pages)
numbers=[int(n) for n in re.findall(r'(?m)^(\d+)\. ',text)]
assert numbers==list(range(1,111)),numbers
print({'pdf':str(out),'pages':len(reader.pages),'questions':len(numbers),'bytes':out.stat().st_size})
