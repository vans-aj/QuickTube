from PIL import Image, ImageDraw

def create_icon(size, filename):
    # Create image with blue background
    img = Image.new('RGB', (size, size), color='#3b82f6')
    draw = ImageDraw.Draw(img)
    
    # Draw white play button
    if size >= 48:
        # Triangle play button
        points = [(size//3, size//4), (size//3, 3*size//4), (3*size//4, size//2)]
        draw.polygon(points, fill='white')
    else:
        # Simple white square for small icon
        margin = size // 4
        draw.rectangle([margin, margin, size-margin, size-margin], fill='white')
    
    img.save(filename)
    print(f"✅ Created {filename}")

# Create all 3 icons
create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')

print("\n🎉 All icons created successfully!")
