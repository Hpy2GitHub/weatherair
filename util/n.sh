# Custom input/output folders and 256px output size
input_dir=../public/images/moon
output_dir=./moon
mkdir $output_dir
python normalize-moons.py --input $input_dir --output $output_dir --size 256

# Skip white-balance correction
#python normalize-moons.py --no-whitebalance

# If the moon detection misses faint crescents, lower the threshold
#python normalize-moons.py --threshold 15
