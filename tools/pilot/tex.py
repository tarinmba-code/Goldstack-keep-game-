# Recolour a KayKit palette texture cell by cell (keeping each cell's gradient), and paint 8 custom swatches into row 3.
import sys, json
from PIL import Image
CUSTOM=[(214,178,112),(34,30,36),(232,184,72),(205,212,222),(196,40,44),(96,60,44),(240,236,226),(54,62,128)]  # straw, lacquer, gold, steel, crimson, leather, cream, indigo
def run(src,dst,remap,size=512):
    im=Image.open(src).convert('RGB'); W,H=im.size; cw,ch=W//8,H//4; px=im.load()
    for key,rgb in remap.items():
        c,r=map(int,key.split(',')); x0,y0=c*cw,r*ch
        Ls=[]; 
        for y in range(y0,y0+ch,4):
            for x in range(x0,x0+cw,4): p=px[x,y]; Ls.append(0.299*p[0]+0.587*p[1]+0.114*p[2])
        Lm=sum(Ls)/len(Ls) or 1
        for y in range(y0,y0+ch):
            for x in range(x0,x0+cw):
                p=px[x,y]; L=(0.299*p[0]+0.587*p[1]+0.114*p[2])/Lm; L=0.55+0.45*L
                px[x,y]=tuple(max(0,min(255,int(v*L))) for v in rgb)
    for i,rgb in enumerate(CUSTOM):
        x0,y0=i*cw,3*ch
        for y in range(y0,y0+ch):
            k=1.12-0.42*(y-y0)/ch
            for x in range(x0,x0+cw): px[x,y]=tuple(max(0,min(255,int(v*k))) for v in rgb)
    im.resize((size,size),Image.LANCZOS).save(dst)
if __name__=='__main__':
    run(sys.argv[1],sys.argv[2],json.loads(sys.argv[3]))
