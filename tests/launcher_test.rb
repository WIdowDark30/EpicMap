require 'minitest/autorun'
require 'tmpdir'
EPICMAP_TEST = true
load File.expand_path('../scripts/epicmap.lic', __dir__)

class LauncherTest < Minitest::Test
  def setup
    @tmp = Dir.mktmpdir('Epic Map ')
    EpicMap.define_singleton_method(:lich_root) { @test_root }
    EpicMap.instance_variable_set(:@test_root, @tmp)
  end

  def teardown
    FileUtils.remove_entry(@tmp)
  end

  def map(path)
    FileUtils.mkdir_p(File.join(path, 'maps'))
    %w[index.html app.js gs4map-data.js].each { |f| File.write(File.join(path, f), '') }
    path
  end

  def test_nested_folder_and_spaces
    expected = map(File.join(@tmp, 'EpicMap', 'EpicMap', 'EpicMap'))
    assert_equal expected.tr('\\', '/'), EpicMap.resolve_directory.tr('\\', '/')
  end

  def test_persistent_override_and_missing_saved_path
    expected = map(File.join(@tmp, 'custom location'))
    assert_equal expected.tr('\\', '/'), EpicMap.resolve_directory(expected).tr('\\', '/')
    assert_equal expected.tr('\\', '/'), EpicMap.resolve_directory.tr('\\', '/')
    FileUtils.remove_entry(expected)
    assert_raises(ArgumentError) { EpicMap.resolve_directory }
  end

  def test_incomplete_package_does_not_save_override
    File.write(File.join(@tmp, 'index.html'), '')
    assert_raises(ArgumentError) { EpicMap.resolve_directory(@tmp) }
    refute File.exist?(EpicMap.config_file)
  end

  def test_port_validation
    assert_raises(ArgumentError) { EpicMap.parse_args(['epicmap', 'port=65536']) }
    assert_equal 7444, EpicMap.parse_args(['epicmap', 'port=7444'])[:port]
  end

  def test_quoted_windows_path
    assert_equal 'C:\Users\A B\EpicMap', EpicMap.parse_args(['epicmap', 'dir="C:\Users\A', 'B\EpicMap"', 'noopen'])[:dir]
    assert_equal 'D:\Map Folder', EpicMap.parse_args(['epicmap', 'dir=D:\Map Folder'])[:dir]
    assert_raises(ArgumentError) { EpicMap.parse_args(['epicmap', 'dir="C:\Unclosed']) }
  end
end
