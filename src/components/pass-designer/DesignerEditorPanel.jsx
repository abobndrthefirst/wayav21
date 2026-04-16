import ColorPickerField, { TEXT_COLOR_PRESETS } from './ColorPickerField'
import BarcodeSelector from './BarcodeSelector'
import DragDropUploader from './DragDropUploader'
import FieldEditor from './FieldEditor'
import PresetIconPicker from './PresetIconPicker'

export default function DesignerEditorPanel({
  shopId, cardColor, setCardColor, textColor, setTextColor,
  logoUrl, setLogoUrl, backgroundUrl, setBackgroundUrl,
  rewardIconUrl, setRewardIconUrl, rewardTitle, setRewardTitle,
  rewardDescription, setRewardDescription,
  barcodeType, setBarcodeType, T, embedded,
}) {
  const Wrap = embedded ? 'div' : 'div'
  return (
    <div className={embedded ? 'pd-editor-inner' : 'pd-editor'}>
      <h3 className="pd-section-title">
        {T('Colors', 'الألوان')}
      </h3>

      <ColorPickerField
        label={T('Background color', 'لون الخلفية')}
        value={cardColor}
        onChange={setCardColor}
      />

      <ColorPickerField
        label={T('Text color', 'لون النص')}
        value={textColor}
        onChange={setTextColor}
        presets={TEXT_COLOR_PRESETS}
      />

      <h3 className="pd-section-title">{T('Barcode', 'الباركود')}</h3>
      <BarcodeSelector value={barcodeType} onChange={setBarcodeType} T={T} />

      <h3 className="pd-section-title">{T('Images', 'الصور')}</h3>

      <DragDropUploader
        label={T('Logo (square)', 'الشعار (مربع)')}
        hint={T('PNG, 512x512px recommended (max 2MB)', 'PNG، الحجم الموصى 512×512 (الحد 2MB)')}
        accept="image/png,image/jpeg"
        url={logoUrl}
        onUrlChange={setLogoUrl}
        shopId={shopId}
        kind="logo"
        T={T}
      />

      <DragDropUploader
        label={T('Cover image', 'صورة الغلاف')}
        hint={T('PNG, 1125x432px recommended (max 2MB)', 'PNG، الحجم الموصى 1125×432 (الحد 2MB)')}
        accept="image/png"
        url={backgroundUrl}
        onUrlChange={setBackgroundUrl}
        shopId={shopId}
        kind="bg"
        T={T}
      />

      <h3 className="pd-section-title">{T('Reward icon', 'أيقونة المكافأة')}</h3>
      <div className="pd-field">
        <label>{T('Pick a preset', 'اختر من المعدّة مسبقاً')}</label>
        <PresetIconPicker selected={rewardIconUrl} onSelect={setRewardIconUrl} />
      </div>

      <DragDropUploader
        label={T('Or upload custom icon', 'أو ارفع أيقونة خاصة')}
        hint={T('PNG, 90x90px recommended', 'PNG شفاف، 90×90 بكسل')}
        accept="image/png"
        url={rewardIconUrl && !rewardIconUrl.startsWith('data:') ? rewardIconUrl : ''}
        onUrlChange={setRewardIconUrl}
        shopId={shopId}
        kind="icon"
        T={T}
      />

      <h3 className="pd-section-title">{T('Content', 'المحتوى')}</h3>

      <FieldEditor
        label={T('Reward title', 'عنوان المكافأة')}
        value={rewardTitle}
        onChange={setRewardTitle}
        maxLength={30}
        placeholder={T('Free coffee', 'قهوة مجانية')}
        T={T}
      />

      <FieldEditor
        label={T('Reward description', 'وصف المكافأة')}
        value={rewardDescription}
        onChange={setRewardDescription}
        maxLength={80}
        placeholder={T('Enjoy a free drink on us!', 'استمتع بمشروب مجاني!')}
        multiline
        T={T}
      />
    </div>
  )
}
