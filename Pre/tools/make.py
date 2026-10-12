import os, subprocess, shutil, glob
from PIL import Image, ImageFilter, ImageEnhance
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC = glob.glob(r"C:\Users\LENOVO\AppData\Local\Temp\claude\*29d40f\*\images")[0]
OUT = "hinojosa-assets"
for d in ["imagenes/marca","imagenes/mascota","imagenes/afiches","imagenes/productos","videos","posters"]:
    os.makedirs(f"{OUT}/{d}", exist_ok=True)
def src(n):
    p = glob.glob(f"{SRC}/{n}.*")[0]; return Image.open(p).convert("RGB")

# ---------- IMÁGENES ----------
names = {
 1:"afiches/01-logo-nuevo-significado",2:"mascota/02-canela-insignia",3:"afiches/03-mision-vision",
 4:"mascota/04-conoce-a-canela",5:"afiches/05-valores-esencia",6:"afiches/06-tu-mejor-aliado",
 7:"productos/07-nutritivos-linea-premium",8:"productos/08-afrecho-trigo-arrocillo",9:"productos/09-maiz",
 10:"productos/10-bebederos-comederos-aves",11:"productos/11-arena-gatos",12:"productos/12-procan-perros",
 13:"productos/13-sal-melaza",14:"productos/14-balanceados-camperito",15:"productos/15-procan-perros-2",
 16:"productos/16-masticables",17:"productos/17-tilapia",18:"productos/18-nutrapro-dogchow-procat",
 19:"productos/19-bebederos-mascotas",20:"productos/20-semillas",
 21:"productos/21-nutritivos-cerdos-vacas-cuyes",22:"productos/22-masticables-mascan"}
for n,p in names.items():
    im = src(n); im.save(f"{OUT}/imagenes/{p}.webp", quality=92); im.save(f"{OUT}/imagenes/{p}.jpg", quality=92)
# recortes útiles
im1 = src(1)
im1.crop((120,20,1080,540)).save(f"{OUT}/imagenes/marca/logo-completo-recorte.png")
im1.crop((440,25,760,290)).save(f"{OUT}/imagenes/marca/isotipo-H-recorte.png")
im4 = src(4); im4.crop((375,100,926,830)).save(f"{OUT}/imagenes/mascota/canela-recorte.png")
im6 = src(6); im6.crop((420,230,912,800)).save(f"{OUT}/imagenes/mascota/canela-pulgar-arriba-recorte.png")
src(2).save(f"{OUT}/imagenes/mascota/canela-insignia-fondo.png")

# ---------- VIDEO ----------
def canvas(im, W, H, margin=0.9, bg=None):
    bgim = im.copy().resize((W,H)) if False else None
    s = max(W/im.width, H/im.height)
    b = im.resize((int(im.width*s)+1,int(im.height*s)+1), Image.LANCZOS)
    x=(b.width-W)//2; y=(b.height-H)//2
    b = b.crop((x,y,x+W,y+H)).filter(ImageFilter.GaussianBlur(40))
    b = ImageEnhance.Brightness(b).enhance(0.55)
    s2 = min(W*margin/im.width, H*margin/im.height)
    f = im.resize((int(im.width*s2),int(im.height*s2)), Image.LANCZOS)
    b.paste(f, ((W-f.width)//2,(H-f.height)//2)); return b

def render(name, imgs, W, H, d=3.2, fade=0.7, fps=30, margin=0.92):
    cvs = [canvas(i,W,H,margin) for i in imgs]
    n=len(cvs); step=d-fade; total=step*(n-1)+d
    frames=int(total*fps)
    outp=f"{OUT}/videos/{name}"
    cmd=[FF,"-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(fps),"-i","-",
         "-c:v","libx264","-pix_fmt","yuv420p","-crf","20","-preset","medium","-movflags","+faststart","-an",outp+".mp4"]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    def fr(i,T):
        t=(T-i*step)/d; e=t*t*(3-2*t)
        z=1+0.07*(e if i%2==0 else 1-e)
        w,h=W/z,H/z; x0=(W-w)/2; y0=(H-h)/2
        return cvs[i].resize((W,H),Image.BICUBIC,box=(x0,y0,x0+w,y0+h))
    first=None
    for k in range(frames):
        T=k/fps; act=[i for i in range(n) if i*step<=T<i*step+d]
        a=act[0]; img=fr(a,T)
        if len(act)>1:
            b=act[1]; al=(T-b*step)/fade; img=Image.blend(img,fr(b,T),min(max(al,0),1))
        if k==0: first=img.copy()
        p.stdin.write(img.tobytes())
    p.stdin.close(); p.wait()
    first.save(f"{OUT}/posters/{name}.jpg",quality=88)
    subprocess.run([FF,"-y","-loglevel","error","-i",outp+".mp4","-c:v","libvpx-vp9","-b:v","0","-crf","34","-an",outp+".webm"])
    print(name,"ok",round(total,1),"s")

_l=Image.open(f"{OUT}/imagenes/marca/logo-completo-recorte.png").convert("RGB")
logo=Image.new("RGB",(1920,1080),"white"); _l=_l.resize((1500,int(1500*_l.height/_l.width)),Image.LANCZOS); logo.paste(_l,((1920-1500)//2,(1080-_l.height)//2))
cane=Image.open(f"{OUT}/imagenes/mascota/canela-recorte.png").convert("RGB")
pulgar=Image.open(f"{OUT}/imagenes/mascota/canela-pulgar-arriba-recorte.png").convert("RGB")
P=lambda n: src(n)
render("01-hero-marca-16x9",[logo,src(2),src(6),src(5)],1920,1080,d=3.6)
render("02-conoce-a-canela-9x16",[src(4),src(2),pulgar,src(6)],1080,1920,d=3.4)
render("03-catalogo-productos-9x16",[P(7),P(21),P(14),P(9),P(8),P(12),P(18),P(11),P(17),P(20)],1080,1920,d=2.8,margin=0.96)
render("04-nosotros-valores-16x9",[src(3),src(5),src(6)],1920,1080,d=4.2,margin=0.95)
render("05-mascotas-y-accesorios-9x16",[P(15),P(16),P(22),P(19),P(10),P(13)],1080,1920,d=2.8,margin=0.96)
