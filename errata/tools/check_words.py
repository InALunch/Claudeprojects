import json, numpy as np, librosa, librosa.display, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
W=json.load(open('audio/words.json'))
y,sr=librosa.load('audio/src.wav',sr=22050)
h,_=librosa.effects.hpss(y,margin=2.0)
for pg in range(0,len(W),8):
    fig,axs=plt.subplots(8,1,figsize=(16,22))
    for ax,(s,e,txt,ws) in zip(axs,W[pg:pg+8]):
        a,b=s-0.4,e+0.5; seg=h[int(a*sr):int(b*sr)]
        C=librosa.amplitude_to_db(np.abs(librosa.stft(seg,n_fft=2048,hop_length=128)),ref=np.max)
        librosa.display.specshow(C,sr=sr,hop_length=128,x_axis='time',y_axis='log',ax=ax,cmap='magma',vmin=-60)
        ax.set_ylim(150,4000)
        for w,t in ws: ax.axvline(t-a,color='cyan',lw=1.5); ax.text(t-a,3000,w,color='white',fontsize=11,weight='bold')
        ax.set_title(f'{s}-{e}: {txt}',fontsize=10); ax.set_xlabel('')
    plt.tight_layout(); plt.savefig(f'out/check/words_{pg//8}.png',dpi=60); plt.close()
